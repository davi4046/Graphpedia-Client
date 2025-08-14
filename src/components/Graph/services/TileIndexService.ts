import Flatbush from "flatbush"
import { TileEntry, TileIndex } from "../types"

export default class TileIndexService {
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
