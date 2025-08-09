import { Parser } from "binary-parser/lib/binary_parser.js"
import Flatbush from "flatbush"
import * as PIXI from "pixi.js"
import * as PIXIViewport from "pixi-viewport"
import { onCleanup, onMount } from "solid-js"
import { gunzipSync } from "fflate"

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

interface Node {
  entity_id: number
  x: number
  y: number
}

interface Edge {
  entity_id1: number
  entity_id2: number
}

interface TileData {
  nodes: Node[]
  edges: Edge[]
}

type GridCell = Map<string, Set<any>>

class Grid {
  private cells = new Map<string, GridCell>()
  private objIndex = new Map<object, string[]>()

  private readonly CELL_SIZE

  constructor(cellSize: number) {
    this.CELL_SIZE = cellSize
  }

  insert(
    obj: object,
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    tag: string
  ) {
    const minCellX = Math.floor(minX / this.CELL_SIZE)
    const minCellY = Math.floor(minY / this.CELL_SIZE)
    const maxCellX = Math.floor(maxX / this.CELL_SIZE)
    const maxCellY = Math.floor(maxY / this.CELL_SIZE)

    const cellKeys: string[] = []

    for (let x = minCellX; x <= maxCellX; x++) {
      for (let y = minCellY; y <= maxCellY; y++) {
        const cellKey = `${x},${y}`
        cellKeys.push(cellKey)

        if (!this.cells.has(cellKey)) {
          this.cells.set(cellKey, new Map<string, Set<any>>())
        }

        const cell = this.cells.get(cellKey)!

        if (!cell.has(tag)) {
          cell.set(tag, new Set<any>())
        }
        cell.get(tag)!.add(obj)
      }
    }

    this.objIndex.set(obj, cellKeys)
  }

  remove(obj: object): boolean {
    const cellKeys = this.objIndex.get(obj)
    if (!cellKeys) return false

    for (const cellKey of cellKeys) {
      const cell = this.cells.get(cellKey)
      if (!cell) continue

      for (const set of cell.values()) {
        set.delete(obj)
      }

      for (const [tag, set] of cell) {
        if (set.size === 0) cell.delete(tag)
      }
      if (cell.size === 0) this.cells.delete(cellKey)
    }

    this.objIndex.delete(obj)
    return true
  }

  query(minX: number, minY: number, maxX: number, maxY: number) {
    const minCellX = Math.floor(minX / this.CELL_SIZE)
    const minCellY = Math.floor(minY / this.CELL_SIZE)
    const maxCellX = Math.floor(maxX / this.CELL_SIZE)
    const maxCellY = Math.floor(maxY / this.CELL_SIZE)

    const cells: GridCell[] = []

    for (let x = minCellX; x <= maxCellX; x++) {
      for (let y = minCellY; y <= maxCellY; y++) {
        const cellKey = `${x},${y}`
        const cell = this.cells.get(cellKey)
        if (cell) cells.push(cell)
      }
    }

    return cells
  }
}

type GraphProps = { graphId: string }

export default function Graph(props: GraphProps) {
  let containerRef: HTMLDivElement | undefined
  let app: PIXI.Application
  let viewport: PIXIViewport.Viewport

  const DATA_URL = import.meta.env.PUBLIC_DATA_URL

  const fetchTileIndex = async () => {
    const url = `${DATA_URL}/graphs/${props.graphId}/tile_index.bin.gz`
    const response = await fetch(url)
    const compressed = new Uint8Array(await response.arrayBuffer())
    const decompressed = gunzipSync(compressed)
    const parsed = tileIndexParser.parse(decompressed)
    return new TileIndex(parsed.entries)
  }

  const fetchTile = async (tilePath: string) => {
    const url = `${DATA_URL}/graphs/${props.graphId}/tiles/${tilePath}.bin.gz`
    const response = await fetch(url)
    const compressed = new Uint8Array(await response.arrayBuffer())
    const decompressed = gunzipSync(compressed)
    const parsed = tileParser.parse(decompressed)
    return parsed as TileData
  }

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

    const tileIndex = await fetchTileIndex()
    const fetchedTiles = new Set<string>()

    const grid = new Grid(256)

    viewport.on("moved", () => {
      const { x, y, width, height } = viewport.getBounds()
      const visibleTiles = tileIndex.query(x, y, x + width, y + height)

      for (const tileEntry of visibleTiles) {
        if (fetchedTiles.has(tileEntry.path)) continue
        fetchedTiles.add(tileEntry.path)

        fetchTile(tileEntry.path).then((tile) => {
          // TODO
        })
      }
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
