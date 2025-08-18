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

export interface EntityData {
  id: number
  name: string
  description: string
  imageUrl?: string
}

export interface GraphStyle {
  nodeSize: number
  arrowHeadTexture: PIXI.Texture
}

export interface CancellablePromise<T> extends Promise<T> {
  cancel: () => void
}

export interface DrawHandle {
  remove(): void
}
