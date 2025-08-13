import { gunzipSync } from "fflate"
import { TileIndexParser, TileParser } from "./parsers"
import * as PIXI from "pixi.js"
import { NodeBBox, Tile, TileEntry, TileIndex } from "./types"
import Flatbush from "flatbush"
import RBush from "rbush"

export async function fetchTileIndex(
  dataUrl: string,
  graphId: string
): Promise<TileIndex> {
  const url = `${dataUrl}/graphs/${graphId}/tile_index.bin.gz`
  const response = await fetch(url)
  const compressed = new Uint8Array(await response.arrayBuffer())
  const decompressed = gunzipSync(compressed)
  const parsed = TileIndexParser.parse(decompressed)
  return parsed
}

export async function fetchTile(
  dataUrl: string,
  graphId: string,
  tileId: number
): Promise<Tile> {
  const url = `${dataUrl}/graphs/${graphId}/tiles/${tileId}.bin.gz`
  const response = await fetch(url)
  const compressed = new Uint8Array(await response.arrayBuffer())
  const decompressed = gunzipSync(compressed)
  const parsed = TileParser.parse(decompressed)
  return parsed
}

export function loadTile(
  nodePosMap: Map<number, [number, number]>,
  nodeEdgesMap: Map<number, Set<PackedEdge>>,
  nodeIndex: RBush<NodeBBox>,
  tile: Tile
) {
  const { nodes, edges } = tile
  for (const node of nodes) {
    nodePosMap.set(node.entityId, [node.x, node.y])

    const nodeBBox: NodeBBox = {
      minX: node.x,
      minY: node.y,
      maxX: node.x,
      maxY: node.y,
      entityId: node.entityId,
    }
    nodeIndex.insert(nodeBBox)
  }
  for (const { sourceId, targetId } of edges) {
    const edge = packEdge(sourceId, targetId)

    if (!nodeEdgesMap.has(sourceId)) {
      nodeEdgesMap.set(sourceId, new Set())
    }
    nodeEdgesMap.get(sourceId)!.add(edge)

    if (!nodeEdgesMap.has(targetId)) {
      nodeEdgesMap.set(targetId, new Set())
    }
    nodeEdgesMap.get(targetId)!.add(edge)
  }
}

export function renderNode(x: number, y: number, size: number) {
  const sprite = new PIXI.Sprite(PIXI.Texture.WHITE)
  sprite.tint = 0x00ff00
  sprite.width = size
  sprite.height = size
  sprite.x = x
  sprite.y = y
  return sprite
}

export function renderLine(x1: number, y1: number, x2: number, y2: number) {
  const graphics = new PIXI.Graphics()
  graphics.moveTo(x1, y1)
  graphics.lineTo(x2, y2)
  graphics.stroke({ color: 0xff0000, width: 2 })
  return graphics
}

export function renderArrowHead() {
  const triangle = new PIXI.Graphics()
  triangle.moveTo(0, 0)
  triangle.lineTo(40, 20)
  triangle.lineTo(0, 40)
  triangle.closePath()
  triangle.fill({
    color: 0xff0000,
  })
  return triangle
}

export type PackedEdge = bigint & { __brand: "PackedEdge" }

export function packEdge(sourceId: number, targetId: number): PackedEdge {
  // Both sourceId and targetId are 32-bit unsigned integers
  const edgeHash = (BigInt(sourceId) << 32n) | BigInt(targetId)
  return edgeHash as PackedEdge
}

export function unpackEdge(packedEdge: PackedEdge): [number, number] {
  const sourceId = Number(packedEdge >> 32n)
  const targetId = Number(packedEdge & 0xffffffffn)
  return [sourceId, targetId]
}

export class TileIndexService {
  private index: Flatbush
  private entries: TileEntry[]

  constructor(tileIndex: TileIndex) {
    this.entries = tileIndex.entries
    this.index = new Flatbush(tileIndex.entries.length)

    for (const entry of this.entries) {
      this.index.add(entry.minX, entry.minY, entry.maxX, entry.maxY)
    }
    this.index.finish()
  }

  query(minX: number, minY: number, maxX: number, maxY: number): TileEntry[] {
    const ids = this.index.search(minX, minY, maxX, maxY)
    return ids.map((i) => this.entries[i])
  }
}
