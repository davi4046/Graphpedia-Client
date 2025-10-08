import { BBox } from "~/types/geometry"

export interface GraphTile {
  readonly id: number
  readonly bbox: BBox
  nodes(): Promise<readonly GraphNode[]>
  edges(): Promise<readonly GraphEdge[]>
}

export interface GraphNode {
  readonly id: number
  readonly x: number
  readonly y: number
  label(): Promise<string>
}

export interface GraphEdge {
  readonly sourceId: number
  readonly targetId: number
}
