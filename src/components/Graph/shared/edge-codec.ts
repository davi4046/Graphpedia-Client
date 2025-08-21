import { Edge } from "../types"

export type EncodedEdge = bigint & { __brand: "EncodedEdge" }

export function encodeEdge(value: Edge): EncodedEdge {
  return ((BigInt(value.sourceId) << 32n) |
    BigInt(value.targetId)) as EncodedEdge
}

export function decodeEdge(value: EncodedEdge): Edge {
  return {
    sourceId: Number(value >> 32n),
    targetId: Number(value & 0xffffffffn),
  }
}
