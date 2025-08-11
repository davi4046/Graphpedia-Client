import { Parser } from "binary-parser/lib/binary_parser.js"
import { Tile, TileIndex } from "./types"

export abstract class TileIndexParser {
  protected static readonly tileEntryParser = new Parser()
    .endianess("little")
    .uint32("tileId")
    .uint32("minX")
    .uint32("minY")
    .uint32("maxX")
    .uint32("maxY")

  protected static readonly tileIndexParser = new Parser().array("entries", {
    type: TileIndexParser.tileEntryParser,
    readUntil: "eof",
  })

  static parse(
    buffer: Buffer<ArrayBufferLike> | Uint8Array<ArrayBufferLike>
  ): TileIndex {
    return TileIndexParser.tileIndexParser.parse(buffer)
  }
}

export abstract class TileParser {
  protected static readonly nodeParser = new Parser()
    .endianess("little")
    .uint32("entityId")
    .uint32("x")
    .uint32("y")

  protected static readonly edgeParser = new Parser()
    .endianess("little")
    .uint32("sourceId")
    .uint32("targetId")

  protected static readonly tileParser = new Parser()
    .endianess("little")
    .uint32("numNodes")
    .array("nodes", {
      type: TileParser.nodeParser,
      length: "numNodes",
    })
    .uint32("numEdges")
    .array("edges", {
      type: TileParser.edgeParser,
      length: "numEdges",
    })

  static parse(
    buffer: Buffer<ArrayBufferLike> | Uint8Array<ArrayBufferLike>
  ): Tile {
    return TileParser.tileParser.parse(buffer)
  }
}
