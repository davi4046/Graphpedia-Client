export interface TileEntry {
  tileId: number
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface TileIndex {
  entries: TileEntry[]
}

export interface Node {
  entity_id: number
  x: number
  y: number
}

export interface Edge {
  entity_id1: number
  entity_id2: number
}

export interface Tile {
  nodes: Node[]
  edges: Edge[]
}

export interface NodeBBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
  entity_id: number
}
