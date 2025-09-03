import { Parser } from "binary-parser/dist/binary_parser.js"
import { gunzipSync } from "fflate"

export interface TileBBoxData {
  tileId: number
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export async function fetchTilesBBoxes(
  dataUrl: string,
  graphId: string
): Promise<TileBBoxData[]> {
  const url = `${dataUrl}/graphs/${graphId}/tiles_bboxes.bin.gz`
  const response = await fetch(url)
  const compressed = new Uint8Array(await response.arrayBuffer())
  const decompressed = gunzipSync(compressed)
  return tileBBoxArrayParser.parse(decompressed)
}

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
    entries.map((entry, index) => ({ tileId: index, ...entry })),
})
