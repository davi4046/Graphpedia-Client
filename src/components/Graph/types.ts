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

export interface FoundEntity {
  readonly _branch: "FoundEntity"
  id: number
  name: string
  description: string
  imageUrl?: string
}

export interface MissingEntity {
  readonly _branch: "MissingEntity"
  id: number
}

export type Entity = FoundEntity | MissingEntity

export interface GraphStyle {
  nodeSize: number
  arrowHeadTexture: PIXI.Texture
}

export interface DrawHandle {
  remove(): void
}

export interface CancellablePromise<T> {
  promise: Promise<T>
  cancel: () => void
}
