import { Parser } from "binary-parser/lib/binary_parser.js"
import { gunzipSync } from "fflate"
import { Tile } from "../types"

const nodeParser = new Parser()
  .endianess("little")
  .uint32("entityId")
  .uint32("x")
  .uint32("y")

const edgeParser = new Parser()
  .endianess("little")
  .uint32("sourceId")
  .uint32("targetId")

const tileParser = new Parser()
  .endianess("little")
  .uint32("numNodes")
  .array("nodes", {
    type: nodeParser,
    length: "numNodes",
  })
  .uint32("numEdges")
  .array("edges", {
    type: edgeParser,
    length: "numEdges",
  })

export async function fetchTile(
  dataUrl: string,
  graphId: string,
  tileId: number
): Promise<Tile> {
  const url = `${dataUrl}/graphs/${graphId}/tiles/${tileId}.bin.gz`
  const response = await fetch(url)
  const compressed = new Uint8Array(await response.arrayBuffer())
  const decompressed = gunzipSync(compressed)
  return tileParser.parse(decompressed)
}
