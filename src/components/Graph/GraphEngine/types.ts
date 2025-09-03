export interface GETile {
  bbox: GETileBBox
  getData(): Promise<GETileData>
}

export interface GETileBBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface GETileData {
  nodes: GENode[]
  edges: GEEdge[]
}

export interface GENode {
  x: number
  y: number
  getData(): Promise<GENodeData>
}

export interface GENodeData {
  label: string
}

export interface GEEdge {
  source: GENode
  target: GENode
}
