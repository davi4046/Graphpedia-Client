import { Parser } from "binary-parser/dist/binary_parser.js"
import { gunzipSync } from "fflate"
import { DATA_URL } from "~/config"

export interface TileEntitiesData {
  tileId: number
  entityIds: number[]
}

export async function fetchTilesEntities(
  graphId: string
): Promise<TileEntitiesData[]> {
  const url = `${DATA_URL}/graphs/${graphId}/tiles_entities.bin.gz`
  const response = await fetch(url)
  const compressed = new Uint8Array(await response.arrayBuffer())
  const decompressed = gunzipSync(compressed)
  return tileEntitiesArrayParser.parse(decompressed)
}

const tileEntitiesParser = new Parser()
  .endianess("little")
  .uint32("count")
  .array("entityIds", {
    type: "uint32le",
    length: "count",
  })

const tileEntitiesArrayParser = new Parser().array("", {
  type: tileEntitiesParser,
  readUntil: "eof",
  formatter: (entries: any[]) =>
    entries.map((entry, index) => ({ tileId: index, ...entry })),
})
