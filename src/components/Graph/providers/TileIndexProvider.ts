import { Parser } from "binary-parser/lib/binary_parser.js"
import { gunzipSync } from "fflate"
import { TileIndex } from "../types"

const tileEntryParser = new Parser()
  .endianess("little")
  .uint32("minX")
  .uint32("minY")
  .uint32("maxX")
  .uint32("maxY")

const tileIndexParser = new Parser().array("entries", {
  type: tileEntryParser,
  readUntil: "eof",
  formatter: (entries: any[]) =>
    entries.map((entry, index) => ({ ...entry, tileId: index })),
})

async function fetchTileIndex(
  dataUrl: string,
  graphId: string
): Promise<TileIndex> {
  const url = `${dataUrl}/graphs/${graphId}/tile_index.bin.gz`
  const response = await fetch(url)
  const compressed = new Uint8Array(await response.arrayBuffer())
  const decompressed = gunzipSync(compressed)
  return tileIndexParser.parse(decompressed)
}

export default class TileIndexProvider {
  constructor(private readonly dataUrl: string) {}

  async getTileIndex(graphId: string): Promise<TileIndex> {
    return fetchTileIndex(this.dataUrl, graphId)
  }
}
