import { Parser } from "binary-parser/lib/binary_parser.js"

const nodeParser = new Parser()
  .endianess("little")
  .uint32("entity_id")
  .uint32("x")
  .uint32("y")

const edgeParser = new Parser()
  .endianess("little")
  .uint32("entity_id1")
  .uint32("entity_id2")

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

self.onmessage = (event) => {
  const tileData = event.data as ArrayBuffer
  const parsedTileData = tileParser.parse(new Uint8Array(tileData))
  self.postMessage(parsedTileData)
}
