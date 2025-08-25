import Flatbush from "flatbush"
import { TileBBox } from "../types"

export default class TileSpatialIndex {
  private index: Flatbush
  private bboxes: TileBBox[]

  constructor(bboxes: TileBBox[]) {
    this.index = new Flatbush(bboxes.length)
    this.bboxes = bboxes

    for (const entry of this.bboxes) {
      this.index.add(entry.minX, entry.minY, entry.maxX, entry.maxY)
    }
    this.index.finish()
  }

  search(minX: number, minY: number, maxX: number, maxY: number): TileBBox[] {
    const ids = this.index.search(minX, minY, maxX, maxY)
    return ids.map((i) => this.bboxes[i])
  }
}
