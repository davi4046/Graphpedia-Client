import { Parser } from "binary-parser/lib/binary_parser.js"
import Flatbush from "flatbush"
import * as PIXI from "pixi.js"
import * as PIXIViewport from "pixi-viewport"
import { onCleanup, onMount } from "solid-js"
import TileParser from "../workers/tile-parser.worker?worker"

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

class TileFetcher {
  private graphId: string

  constructor(graphId: string) {
    this.graphId = graphId
  }

  async fetchTile(tilePath: string): Promise<ArrayBuffer> {
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
    return tileData
  }
}

class RefCountMap {
  private map: Map<string, number>

  constructor() {
    this.map = new Map()
  }

  increment(id: string): number {
    const current = this.map.get(id) || 0
    const next = current + 1
    this.map.set(id, next)
    return next
  }

  decrement(id: string): number {
    const current = this.map.get(id) || 0
    if (current <= 1) {
      this.map.delete(id)
      return 0
    } else {
      const next = current - 1
      this.map.set(id, next)
      return next
    }
  }
}

interface Point {
  x: number
  y: number
}

class TileLoader {
  private container: PIXI.Container
  private refCount = new RefCountMap()

  constructor(container: PIXI.Container) {
    this.container = container
  }

  loadTile(tileData: any): {
    unloadTile: () => void
  } {
    const nodeDict: { [key: number]: Point } = {}
    const tileObjs: [string, PIXI.Container][] = []

    for (const node of tileData.nodes) {
      nodeDict[node.entity_id] = { x: node.x, y: node.y }

      if (this.refCount.increment(node.entity_id) > 1) {
        continue // Avoid loading nodes shared between tiles
      }

      const sprite = new PIXI.Sprite(PIXI.Texture.WHITE)
      sprite.tint = 0x00ff00
      sprite.width = sprite.height = 10
      sprite.position.set(node.x - 5, node.y - 5)
      sprite.cullable = true
      this.container.addChild(sprite)

      tileObjs.push([node.entity_id.toString(), sprite])
    }

    for (const edge of tileData.edges) {
      const { entity_id1, entity_id2 } = edge
      const node1 = nodeDict[entity_id1]
      const node2 = nodeDict[entity_id2]

      if (node1 === undefined || node2 === undefined) {
        continue
      }

      const edgeId = `${entity_id1}-${entity_id2}`

      if (this.refCount.increment(edgeId) > 1) {
        continue // Avoid loading edges shared between tiles
      }

      const line = new PIXI.Graphics()
      line.moveTo(node1.x, node1.y)
      line.lineTo(node2.x, node2.y)
      line.stroke({ color: 0xff0000, pixelLine: true })
      line.cullable = true
      this.container.addChildAt(line, 0)

      tileObjs.push([edgeId, line])
    }

    const unloadTile = () => {
      for (const [id, obj] of tileObjs) {
        if (this.refCount.decrement(id) > 0) continue
        this.container.removeChild(obj)
      }
    }

    return { unloadTile }
  }
}

class GraphLoader {
  private viewport: PIXIViewport.Viewport
  private moveHandler: ((event: any) => void) | null = null
  private lastMoveTime = 0
  private throttleDelay = 250 // milliseconds
  private tileParser: Worker

  constructor(viewport: PIXIViewport.Viewport, tileParser: Worker) {
    this.viewport = viewport
    this.tileParser = tileParser
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
        loadedTiles.add(tile.path)
        const tileData = await tileFetcher.fetchTile(tile.path)
        this.tileParser.postMessage(tileData, [tileData])
      }
    }

    this.tileParser.onmessage = (event) => {
      tileLoader.loadTile(event.data)
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
  let tileParser: Worker
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

    tileParser = new TileParser()
    graphLoader = new GraphLoader(viewport, tileParser)
    graphLoader.loadGraph(props.graphId)
  })

  onCleanup(() => {
    app?.destroy(true, { children: true })
    tileParser?.terminate()
  })

  return (
    <div>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  )
}
