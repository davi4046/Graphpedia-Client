import { Parser } from "binary-parser/dist/binary_parser.js"
import { gunzipSync } from "fflate"
import { DATA_URL } from "~/config"

export interface NodeData {
  entityId: number
  x: number
  y: number
}

export interface EdgeData {
  sourceId: number
  targetId: number
}

export interface TileData {
  nodes: NodeData[]
  edges: EdgeData[]
}

export async function fetchTile(
  graphId: string,
  tileId: number
): Promise<TileData> {
  const url = `${DATA_URL}/graphs/${graphId}/tiles/${tileId}.bin.gz`
  const response = await fetch(url)
  const compressed = new Uint8Array(await response.arrayBuffer())
  const decompressed = gunzipSync(compressed)
  return tileParser.parse(decompressed)
}

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
