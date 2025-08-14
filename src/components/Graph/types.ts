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
  entityId: number
  x: number
  y: number
}

export interface Edge {
  sourceId: number
  targetId: number
}

export interface Tile {
  nodes: Node[]
  edges: Edge[]
}
