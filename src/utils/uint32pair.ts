export type PackedUInt32Pair = bigint & { __brand: "PackedUInt32Pair" }

export function packUInt32Pair(a: number, b: number): PackedUInt32Pair {
  return ((BigInt(a) << 32n) | BigInt(b)) as PackedUInt32Pair
}

export function unpackUInt32Pair(value: PackedUInt32Pair): [number, number] {
  const a = Number(value >> 32n)
  const b = Number(value & 0xffffffffn)
  return [a, b]
}
