import Flatbush from "flatbush"
import { TileEntry, TileIndex } from "../types"

export default class TileSpatialIndex {
  private index: Flatbush
  private entries: TileEntry[]

  constructor(tileIndex: TileIndex) {
    this.index = new Flatbush(tileIndex.entries.length)
    this.entries = tileIndex.entries

    for (const entry of this.entries) {
      this.index.add(entry.minX, entry.minY, entry.maxX, entry.maxY)
    }
    this.index.finish()
  }

  search(minX: number, minY: number, maxX: number, maxY: number): TileEntry[] {
    const ids = this.index.search(minX, minY, maxX, maxY)
    return ids.map((i) => this.entries[i])
  }
}
