import { Parser } from "binary-parser/lib/binary_parser.js"
import { gunzipSync } from "fflate"
import { TileBBox } from "../types"

const tileBBoxParser = new Parser()
  .endianess("little")
  .uint32("minX")
  .uint32("minY")
  .uint32("maxX")
  .uint32("maxY")

const tileBBoxArrayParser = new Parser().array("", {
  type: tileBBoxParser,
  readUntil: "eof",
  formatter: (entries: any[]) =>
    entries.map((entry, index) => ({ ...entry, tileId: index })),
})

async function fetchTileBBoxes(
  dataUrl: string,
  graphId: string
): Promise<TileBBox[]> {
  const url = `${dataUrl}/graphs/${graphId}/tiles_bboxes.bin.gz`
  const response = await fetch(url)
  const compressed = new Uint8Array(await response.arrayBuffer())
  const decompressed = gunzipSync(compressed)
  return tileBBoxArrayParser.parse(decompressed)
}

export default class TileBBoxesProvider {
  constructor(private readonly dataUrl: string) {}

  async getTileBBoxes(graphId: string): Promise<TileBBox[]> {
    return fetchTileBBoxes(this.dataUrl, graphId)
  }
}
