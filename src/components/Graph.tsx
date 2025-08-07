import { Parser } from "binary-parser/lib/binary_parser.js"
import Flatbush from "flatbush"
import * as PIXI from "pixi.js"
import * as PIXIViewport from "pixi-viewport"
import { onCleanup, onMount } from "solid-js"

const tileEntryParser = new Parser()
  .endianess("little")
  .uint16("pathLength")
  .string("path", {
    length: "pathLength",
    encoding: "utf8",
  })
  .uint32("xmin")
  .uint32("ymin")
  .uint32("xmax")
  .uint32("ymax")

const tileIndexParser = new Parser().array("entries", {
  type: tileEntryParser,
  readUntil: (_, buffer) => buffer.length === 0,
})

interface TileEntry {
  path: string
  xmin: number
  ymin: number
  xmax: number
  ymax: number
}

class TileIndex {
  private index: Flatbush
  private entries: TileEntry[]

  constructor(entries: TileEntry[]) {
    this.entries = entries
    this.index = new Flatbush(entries.length)

    for (const entry of entries) {
      this.index.add(entry.xmin, entry.ymin, entry.xmax, entry.ymax)
    }
    this.index.finish()
  }

  query(minX: number, minY: number, maxX: number, maxY: number): TileEntry[] {
    const ids = this.index.search(minX, minY, maxX, maxY)
    return ids.map((i) => this.entries[i])
  }
}

const nodeParser = new Parser()
  .endianess("little")
  .uint32("entity_id")
  .uint32("x")
  .uint32("y")

const edgeParser = new Parser()
  .endianess("little")
  .uint32("entity_id1")
  .uint32("entity_id2")

const tileParser = new Parser()
  .endianess("little")
  .uint32("numNodes")
  .array("nodes", {
    type: nodeParser,
    length: "numNodes",
  })
  .uint32("numEdges")
  .array("edges", {
    type: edgeParser,
    length: "numEdges",
  })

type GraphProps = { graphId: string }

export default function Graph(props: GraphProps) {
  let containerRef: HTMLDivElement | undefined
  let app: PIXI.Application
  let viewport: PIXIViewport.Viewport
  let edgeLayer: PIXI.Container
  let nodeLayer: PIXI.Container
  let tileIndex: TileIndex

  const fetchedTiles = new Set<string>()
  const loadedNodes = new Set<number>()
  const loadedEdges = new Set<[number, number]>()

  async function fetchTile(tilePath: string) {
    const dataUrl = import.meta.env.PUBLIC_DATA_URL
    const tileUrl = `${dataUrl}/graphs/${props.graphId}/tiles/${tilePath}.bin.gz`
    const response = await fetch(tileUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch tile: ${response.statusText}`)
    }

    const compressedData = await response.arrayBuffer()
    const blob = new Blob([compressedData])

    const decompressedStream = new DecompressionStream("gzip")
    const decompressedResponse = new Response(
      blob.stream().pipeThrough(decompressedStream)
    )

    const tileData = await decompressedResponse.arrayBuffer()
    const parsedTileData = tileParser.parse(new Uint8Array(tileData))

    return parsedTileData
  }

  function loadTile(tileData: any) {
    const nodeDict: { [key: number]: { x: number; y: number } } = {}

    for (const node of tileData.nodes) {
      // Avoid loading nodes shared between tiles
      if (loadedNodes.has(node.entity_id)) continue

      const sprite = new PIXI.Sprite(PIXI.Texture.WHITE)
      sprite.tint = 0x00ff00
      sprite.width = sprite.height = 10
      sprite.position.set(node.x, node.y)
      nodeLayer.addChild(sprite)
      nodeDict[node.entity_id] = { x: node.x, y: node.y }
    }

    for (const edge of tileData.edges) {
      const { entity_id1, entity_id2 } = edge
      const node1 = nodeDict[entity_id1]
      const node2 = nodeDict[entity_id2]

      if (node1 && node2) {
        // Avoid loading edges shared between tiles
        if (loadedEdges.has([entity_id1, entity_id2])) continue

        const line = new PIXI.Graphics()
        line.moveTo(node1.x + 5, node1.y + 5)
        line.lineTo(node2.x + 5, node2.y + 5)
        line.stroke({ color: 0xff0000, pixelLine: true })
        edgeLayer.addChild(line)
      }
    }

    console.log(
      `Loaded tile with ${tileData.nodes.length} nodes and ${tileData.edges.length} edges`
    )
  }

  onMount(() => {
    const fetchTileIndex = (async () => {
      try {
        const dataUrl = import.meta.env.PUBLIC_DATA_URL
        const tileIndexUrl = `${dataUrl}/graphs/${props.graphId}/tile_index.bin.gz`
        const response = await fetch(tileIndexUrl)

        if (!response.ok) {
          throw new Error(`Failed to fetch tile index: ${response.statusText}`)
        }

        const compressedData = await response.arrayBuffer()
        const blob = new Blob([compressedData])

        const decompressedStream = new DecompressionStream("gzip")
        const decompressedResponse = new Response(
          blob.stream().pipeThrough(decompressedStream)
        )

        const indexData = await decompressedResponse.arrayBuffer()
        const parsedIndexData = tileIndexParser.parse(new Uint8Array(indexData))

        tileIndex = new TileIndex(parsedIndexData.entries)
      } catch (error) {
        console.error("Error loading tile index:", error)
      }
    })()

    const setupPixi = (async () => {
      app = new PIXI.Application()
      await app.init({
        background: "#1099bb",
        resizeTo: window,
      })

      if (containerRef) {
        containerRef.appendChild(app.canvas)
      }

      viewport = new PIXIViewport.Viewport({
        screenWidth: app.screen.width,
        screenHeight: app.screen.height,
        worldWidth: 50000,
        worldHeight: 50000,
        events: app.renderer.events,
      })

      app.stage.addChild(viewport)

      viewport.drag().pinch().wheel().decelerate()

      edgeLayer = new PIXI.Container()
      nodeLayer = new PIXI.Container()

      viewport.addChild(edgeLayer)
      viewport.addChild(nodeLayer)

      viewport.on("moved", () => {
        const bounds = viewport.getVisibleBounds()
        tileIndex
          .query(
            bounds.x,
            bounds.y,
            bounds.x + bounds.width,
            bounds.y + bounds.height
          )
          .forEach(async (entry) => {
            if (fetchedTiles.has(entry.path)) return
            fetchedTiles.add(entry.path) // Do this before fetching
            const tileData = await fetchTile(entry.path)
            loadTile(tileData)
          })
      })

      const sprite = viewport.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
      sprite.tint = 0xff0000
      sprite.width = sprite.height = 100
      sprite.position.set(100, 100)
    })()

    Promise.all([fetchTileIndex, setupPixi]).then(() => {
      console.log("App and tile index ready")
    })
  })

  onCleanup(() => {
    app?.destroy(true, { children: true })
  })

  return (
    <div>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  )
}
