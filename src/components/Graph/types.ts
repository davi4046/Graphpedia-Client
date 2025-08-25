import * as PIXI from "pixi.js"

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

export interface TileBBox {
  tileId: number
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface Entity {
  id: number
  name: string
  description: string
  imageUrl?: string
}

export interface GraphStyle {
  nodeSize: number
  edgeHeadTexture: PIXI.Texture
}

export interface Visual {
  remove(): void
}

export interface PendingRequest<T> {
  promise: Promise<T>
  cancel: () => void
}
