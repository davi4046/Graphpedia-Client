import { gunzipSync } from "fflate"
import Flatbush from "flatbush"
import * as PIXI from "pixi.js"
import { TileIndexParser, TileParser } from "./parsers"
import { Tile, TileEntry, TileIndex } from "./types"

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

export function renderEdge(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  arrowHeadTexture: PIXI.Texture
) {
  const dx = x2 - x1
  const dy = y2 - y1
  const angle = Math.atan2(dy, dx)

  const edgeGraphics = renderLine(x1, y1, x2, y2)

  const arrowHeadSprite = new PIXI.Sprite(arrowHeadTexture)
  arrowHeadSprite.scale.set(0.2)
  arrowHeadSprite.anchor.set(1, 0.5)
  arrowHeadSprite.x = x2
  arrowHeadSprite.y = y2
  arrowHeadSprite.rotation = angle

  edgeGraphics.addChild(arrowHeadSprite)

  return edgeGraphics
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
