import { GraphEdge, GraphNode } from "./dataAdapter"
import EdgeView from "./EdgeView"
import NodeView from "./NodeView"

export default class GraphState {
  nodes = new Map<number, GraphNode>()
  edges = new EdgeMap<GraphEdge>()

  nodeTargetsMap = new Map<number, Set<number>>()
  nodeSourcesMap = new Map<number, Set<number>>()

  renderedNodes = new Map<number, NodeView | undefined>()
  renderedEdges = new EdgeMap<EdgeView>()
}

class EdgeMap<T> {
  private map = new Map<number, Map<number, T>>()

  set(sourceId: number, targetId: number, value: T) {
    if (!this.map.has(sourceId)) {
      this.map.set(sourceId, new Map())
    }
    this.map.get(sourceId)!.set(targetId, value)
  }

  get(sourceId: number, targetId: number): T | undefined {
    return this.map.get(sourceId)?.get(targetId)
  }

  delete(sourceId: number, targetId: number) {
    this.map.get(sourceId)?.delete(targetId)
  }
}
