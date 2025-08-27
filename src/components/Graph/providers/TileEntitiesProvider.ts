import { Parser } from "binary-parser/lib/binary_parser.js"
import { gunzipSync } from "fflate"
import { TileEntities } from "../types"

const tileEntitiesParser = new Parser()
  .endianess("little")
  .uint32("count")
  .array("entityIds", {
    type: "uint32le",
    length: "count",
  })

const tileEntitiesArrayParser = new Parser().array("tiles", {
  type: tileEntitiesParser,
  readUntil: "eof",
  formatter: (entries: any[]) =>
    entries.map((entry, index) => ({ ...entry, tileId: index })),
})

async function fetchTileEntities(
  dataUrl: string,
  graphId: string
): Promise<TileEntities[]> {
  const url = `${dataUrl}/graphs/${graphId}/tiles_entities.bin`
  const response = await fetch(url)
  const compressed = new Uint8Array(await response.arrayBuffer())
  const decompressed = gunzipSync(compressed)
  return tileEntitiesArrayParser.parse(decompressed)
}

export default class TileEntitiesProvider {
  constructor(private readonly dataUrl: string) {}

  async getTileEntities(graphId: string): Promise<TileEntities[]> {
    return fetchTileEntities(this.dataUrl, graphId)
  }
}
