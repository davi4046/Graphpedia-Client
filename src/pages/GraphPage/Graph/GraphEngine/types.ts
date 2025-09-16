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
  id: NodeId
  x: number
  y: number
  getData(): Promise<GENodeData>
}

export interface GENodeData {
  label: string
}

export interface GEEdge {
  id: EdgeId
  source: GENode
  target: GENode
}

export type NodeId = string
export type EdgeId = string
