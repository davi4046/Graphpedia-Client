import { Parser } from "binary-parser/lib/binary_parser.js"
import { gunzipSync } from "fflate"
import { TileBBox } from "../types"

const tileEntryParser = new Parser()
  .endianess("little")
  .uint32("minX")
  .uint32("minY")
  .uint32("maxX")
  .uint32("maxY")

const tileBBoxesParser = new Parser().array("", {
  type: tileEntryParser,
  readUntil: "eof",
  formatter: (entries: any[]) =>
    entries.map((entry, index) => ({ ...entry, tileId: index })),
})

async function fetchTileBBoxes(
  dataUrl: string,
  graphId: string
): Promise<TileBBox[]> {
  const url = `${dataUrl}/graphs/${graphId}/tile_bboxes.bin.gz`
  const response = await fetch(url)
  const compressed = new Uint8Array(await response.arrayBuffer())
  const decompressed = gunzipSync(compressed)
  return tileBBoxesParser.parse(decompressed)
}

export default class TileIndexProvider {
  constructor(private readonly dataUrl: string) {}

  async getTileIndex(graphId: string): Promise<TileBBox[]> {
    return fetchTileBBoxes(this.dataUrl, graphId)
  }
}
