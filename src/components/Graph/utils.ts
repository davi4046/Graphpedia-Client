import { gunzipSync } from "fflate"
import { TileIndexParser, TileParser } from "./parsers"
import * as PIXI from "pixi.js"
import { Tile, TileEntry, TileIndex } from "./types"
import Flatbush from "flatbush"

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
  tilePath: string
): Promise<Tile> {
  const url = `${dataUrl}/graphs/${graphId}/tiles/${tilePath}.bin.gz`
  const response = await fetch(url)
  const compressed = new Uint8Array(await response.arrayBuffer())
  const decompressed = gunzipSync(compressed)
  const parsed = TileParser.parse(decompressed)
  return parsed
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

export function renderEdge(x1: number, y1: number, x2: number, y2: number) {
  const graphics = new PIXI.Graphics()
  graphics.moveTo(x1, y1)
  graphics.lineTo(x2, y2)
  graphics.stroke({ color: 0xff0000, width: 2 })
  return graphics
}

export function cantorPairing(a: number, b: number): number {
  return ((a + b) * (a + b + 1)) / 2 + b
}

export class TileIndexService {
  private index: Flatbush
  private entries: TileEntry[]

  constructor(tileIndex: TileIndex) {
    this.entries = tileIndex.entries
    this.index = new Flatbush(tileIndex.entries.length)

    for (const entry of this.entries) {
      this.index.add(entry.xmin, entry.ymin, entry.xmax, entry.ymax)
    }
    this.index.finish()
  }

  query(minX: number, minY: number, maxX: number, maxY: number): TileEntry[] {
    const ids = this.index.search(minX, minY, maxX, maxY)
    return ids.map((i) => this.entries[i])
  }
}
