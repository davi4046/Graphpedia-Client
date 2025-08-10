import { gunzipSync } from "fflate"
import { Parser } from "binary-parser/lib/binary_parser.js"
import Flatbush from "flatbush"
import RBush from "rbush"
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

interface Node {
  entity_id: number
  x: number
  y: number
}

interface Edge {
  entity_id1: number
  entity_id2: number
}

interface Tile {
  nodes: Node[]
  edges: Edge[]
}

async function fetchTileIndex(
  dataUrl: string,
  graphId: string
): Promise<TileIndex> {
  const url = `${dataUrl}/graphs/${graphId}/tile_index.bin.gz`
  const response = await fetch(url)
  const compressed = new Uint8Array(await response.arrayBuffer())
  const decompressed = gunzipSync(compressed)
  const parsed = tileIndexParser.parse(decompressed)
  return new TileIndex(parsed.entries)
}

async function fetchTile(
  dataUrl: string,
  graphId: string,
  tilePath: string
): Promise<Tile> {
  const url = `${dataUrl}/graphs/${graphId}/tiles/${tilePath}.bin.gz`
  const response = await fetch(url)
  const compressed = new Uint8Array(await response.arrayBuffer())
  const decompressed = gunzipSync(compressed)
  const parsed = tileParser.parse(decompressed)
  return parsed
}

class NodePosMap {
  private map = new Map<number, [x: number, y: number]>()

  insert(node: Node) {
    this.map.set(node.entity_id, [node.x, node.y])
  }
}

class NodeEdgesMap {
  private map = new Map<number, Set<number>>()

  insert(edge: Edge) {
    const source = edge.entity_id1
    const target = edge.entity_id2

    if (!this.map.has(source)) {
      this.map.set(source, new Set())
    }
    this.map.get(source)!.add(target)

    if (!this.map.has(target)) {
      this.map.set(target, new Set())
    }
    this.map.get(target)!.add(source)
  }
}

interface NodeBBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
  entity_id: number
}

function renderNode(x: number, y: number) {
  const sprite = new PIXI.Sprite(PIXI.Texture.WHITE)
  sprite.tint = 0x00ff00
  sprite.width = 10
  sprite.height = 10
  sprite.x = x
  sprite.y = y
  return sprite
}

function renderEdge(x1: number, y1: number, x2: number, y2: number) {
  const graphics = new PIXI.Graphics()
  graphics.moveTo(x1, y1)
  graphics.lineTo(x2, y2)
  graphics.stroke({ color: 0xff0000, width: 1 })
  return graphics
}

type GraphProps = { graphId: string }

export default function Graph(props: GraphProps) {
  let containerRef: HTMLDivElement | undefined
  let app: PIXI.Application
  let viewport: PIXIViewport.Viewport

  const DATA_URL = import.meta.env.PUBLIC_DATA_URL

  const fetchedTiles = new Set<string>()
  const nodeIndex = new RBush<NodeBBox>()
  const nodePosMap = new NodePosMap()
  const nodeEdgesMap = new NodeEdgesMap()

  const drawnNodes = new Map<number, PIXI.Sprite>()

  onMount(async () => {
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

    const tileIndex = await fetchTileIndex(DATA_URL, props.graphId)

    viewport.on("moved", async () => {
      const { x, y, width, height } = viewport.getVisibleBounds()
      const visibleTiles = tileIndex.query(x, y, x + width, y + height)

      for (const tileEntry of visibleTiles) {
        if (fetchedTiles.has(tileEntry.path)) continue
        fetchedTiles.add(tileEntry.path)

        fetchTile(DATA_URL, props.graphId, tileEntry.path).then(
          ({ nodes, edges }) => {
            for (const node of nodes) {
              nodePosMap.insert(node)

              const nodeBBox: NodeBBox = {
                minX: node.x,
                minY: node.y,
                maxX: node.x,
                maxY: node.y,
                entity_id: node.entity_id,
              }
              nodeIndex.insert(nodeBBox)
            }
            for (const edge of edges) {
              nodeEdgesMap.insert(edge)
            }
          }
        )
      }

      const result = nodeIndex.search({
        minX: x,
        minY: y,
        maxX: x + width,
        maxY: y + height,
      })

      const visibleNodeIds = new Set<number>()

      for (const nodeBBox of result) {
        if (!drawnNodes.has(nodeBBox.entity_id)) {
          const sprite = renderNode(nodeBBox.minX, nodeBBox.minY)
          drawnNodes.set(nodeBBox.entity_id, sprite)
          viewport.addChild(sprite)
        }
        visibleNodeIds.add(nodeBBox.entity_id)
      }

      for (const [entityId, sprite] of drawnNodes) {
        if (!visibleNodeIds.has(entityId)) {
          drawnNodes.delete(entityId)
          viewport.removeChild(sprite)
        }
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
