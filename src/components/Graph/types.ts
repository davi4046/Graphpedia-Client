import * as PIXI from "pixi.js"

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

export interface Entity {
  id: number
  name: string
  description: string
  imageUrl?: string
}

export type EntityResult = Entity | { id: number; error: string }

export interface GraphStyle {
  nodeSize: number
  arrowHeadTexture: PIXI.Texture
}

export interface DrawHandle {
  remove(): void
  setLOD(level: number): void
}

export interface CancellablePromise<T> {
  promise: Promise<T>
  cancel: () => void
}
