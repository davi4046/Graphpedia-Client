export interface TileEntry {
  path: string
  xmin: number
  ymin: number
  xmax: number
  ymax: number
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
