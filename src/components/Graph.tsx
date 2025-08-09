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

class TileFetcher {
  private graphId: string

  constructor(graphId: string) {
    this.graphId = graphId
  }

  async fetchTile(tilePath: string): Promise<any> {
    const dataUrl = import.meta.env.PUBLIC_DATA_URL
    const tileUrl = `${dataUrl}/graphs/${this.graphId}/tiles/${tilePath}.bin.gz`
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
}

interface Point {
  x: number
  y: number
}

class TileLoader {
  private container: PIXI.Container
  private loadedNodes: Set<number> = new Set()
  private loadedEdges: Set<[number, number]> = new Set()

  constructor(container: PIXI.Container) {
    this.container = container
  }

  loadTile(tileData: any) {
    const nodeDict: { [key: number]: Point } = {}

    for (const node of tileData.nodes) {
      // Avoid loading nodes shared between tiles
      if (this.loadedNodes.has(node.entity_id)) continue

      const sprite = new PIXI.Sprite(PIXI.Texture.WHITE)
      sprite.tint = 0x00ff00
      sprite.width = sprite.height = 10
      sprite.position.set(node.x - 5, node.y - 5)
      sprite.cullable = true
      this.container.addChild(sprite)
      nodeDict[node.entity_id] = { x: node.x, y: node.y }
    }

    for (const edge of tileData.edges) {
      const { entity_id1, entity_id2 } = edge
      const node1 = nodeDict[entity_id1]
      const node2 = nodeDict[entity_id2]

      if (node1 && node2) {
        // Avoid loading edges shared between tiles
        if (this.loadedEdges.has([entity_id1, entity_id2])) continue

        const { p1, p2 } = TileLoader.findLineEndpoints(node1, node2, 10)

        const line = new PIXI.Graphics()
        line.moveTo(p1.x, p1.y)
        line.lineTo(p2.x, p2.y)
        line.stroke({ color: 0xff0000, pixelLine: true })
        line.cullable = true
        this.container.addChildAt(line, 0)
      }
    }
  }

  private static intersectSquareBoundary(
    center: Point,
    halfSize: number,
    direction: Point
  ): Point {
    const { x: cx, y: cy } = center
    const { x: dx, y: dy } = direction
    let tX = dx !== 0 ? (dx > 0 ? halfSize / dx : -halfSize / dx) : Infinity
    let tY = dy !== 0 ? (dy > 0 ? halfSize / dy : -halfSize / dy) : Infinity
    const pX = { x: cx + tX * dx, y: cy + tX * dy }
    const pY = { x: cx + tY * dx, y: cy + tY * dy }
    const validPX = Math.abs(pX.y - cy) <= halfSize
    const validPY = Math.abs(pY.x - cx) <= halfSize
    if (validPX && validPY) return tX < tY ? pX : pY
    if (validPX) return pX
    if (validPY) return pY
    return center
  }

  private static findLineEndpoints(
    c1: Point,
    c2: Point,
    sideLength: number
  ): { p1: Point; p2: Point } {
    const halfSize = sideLength / 2
    const dx = c2.x - c1.x
    const dy = c2.y - c1.y
    const length = Math.sqrt(dx * dx + dy * dy)
    if (length === 0) return { p1: c1, p2: c2 }
    const dir1 = { x: dx / length, y: dy / length }
    const dir2 = { x: -dir1.x, y: -dir1.y }
    return {
      p1: TileLoader.intersectSquareBoundary(c1, halfSize, dir1),
      p2: TileLoader.intersectSquareBoundary(c2, halfSize, dir2),
    }
  }
}

class GraphLoader {
  private viewport: PIXIViewport.Viewport
  private moveHandler: ((event: any) => void) | null = null
  private lastMoveTime = 0
  private throttleDelay = 250 // milliseconds

  constructor(viewport: PIXIViewport.Viewport) {
    this.viewport = viewport
  }

  async loadGraph(graphId: string) {
    if (this.moveHandler) {
      this.viewport.off("moved", this.moveHandler)
      this.moveHandler = null
    }

    this.viewport.removeChildren()

    const dataUrl = import.meta.env.PUBLIC_DATA_URL
    const tileIndexUrl = `${dataUrl}/graphs/${graphId}/tile_index.bin.gz`
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

    const debugContainer = new PIXI.Container()
    this.viewport.addChild(debugContainer)

    for (const entry of parsedIndexData.entries) {
      const sprite = PIXI.Sprite.from(PIXI.Texture.WHITE)
      const r = Math.floor(128 + Math.random() * 127) // 128-255
      const g = Math.floor(128 + Math.random() * 127) // 128-255
      const b = Math.floor(128 + Math.random() * 127) // 128-255
      sprite.tint = (r << 16) | (g << 8) | b
      sprite.width = entry.xmax - entry.xmin
      sprite.height = entry.ymax - entry.ymin
      sprite.position.set(entry.xmin, entry.ymin)
      debugContainer.addChild(sprite)
    }

    const tileContainer = new PIXI.Container()
    this.viewport.addChild(tileContainer)

    const tileIndex = new TileIndex(parsedIndexData.entries)
    const tileFetcher = new TileFetcher(graphId)
    const tileLoader = new TileLoader(tileContainer)
    const loadedTiles = new Set<string>()

    const loadTiles = async () => {
      const bounds = this.viewport.getVisibleBounds()
      const tiles = tileIndex.query(
        bounds.x,
        bounds.y,
        bounds.x + bounds.width,
        bounds.y + bounds.height
      )
      for (const tile of tiles) {
        if (loadedTiles.has(tile.path)) continue
        const tileData = await tileFetcher.fetchTile(tile.path)
        tileLoader.loadTile(tileData)
        loadedTiles.add(tile.path)
      }
    }

    this.moveHandler = () => {
      const now = Date.now()
      if (now - this.lastMoveTime >= this.throttleDelay) {
        this.lastMoveTime = now
        loadTiles()
      }
    }

    this.viewport.on("moved", this.moveHandler)

    // Load initial tiles
    loadTiles()
  }
}

type GraphProps = { graphId: string }

export default function Graph(props: GraphProps) {
  let containerRef: HTMLDivElement | undefined
  let app: PIXI.Application
  let viewport: PIXIViewport.Viewport
  let graphLoader: GraphLoader

  onMount(async () => {
    PIXI.extensions.add(PIXI.CullerPlugin)

    app = new PIXI.Application()
    await app.init({
      background: "#1099bb",
      resizeTo: window,
      preference: "webgpu",
      antialias: false,
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

    if (app.renderer.type !== PIXI.RendererType.WEBGPU) {
      viewport.cullableChildren = false
    }

    graphLoader = new GraphLoader(viewport)
    graphLoader.loadGraph(props.graphId)
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
