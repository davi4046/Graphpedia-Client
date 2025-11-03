import { Parser } from "binary-parser/dist/binary_parser.js"

const nodeParser = new Parser()
  .endianess("little")
  .uint32("id")
  .uint32("x")
  .uint32("y")

const edgeParser = new Parser()
  .endianess("little")
  .uint32("sourceId")
  .uint32("targetId")

export const tileParser = new Parser()
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

const tileBBoxParser = new Parser()
  .endianess("little")
  .uint32("minX")
  .uint32("minY")
  .uint32("maxX")
  .uint32("maxY")

export const tileBBoxArrayParser = new Parser().array("", {
  type: tileBBoxParser,
  readUntil: "eof",
  formatter: (bboxes: any[]) =>
    bboxes.map((bbox, index) => ({ id: index, bbox })),
})

const tileEntitiesParser = new Parser()
  .endianess("little")
  .uint32("count")
  .array("entityIds", {
    type: "uint32le",
    length: "count",
  })

export const tileEntitiesArrayParser = new Parser().array("", {
  type: tileEntitiesParser,
  readUntil: "eof",
  formatter: (entries: any[]) =>
    entries.map((entry, index) => ({ id: index, ...entry })),
})
