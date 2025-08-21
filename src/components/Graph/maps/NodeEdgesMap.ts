import { decodeEdge, EncodedEdge, encodeEdge } from "../shared/edge-codec"
import { Edge } from "../types"

export default class NodeEdgesMap {
  private map: Map<number, Set<EncodedEdge>> = new Map()

  addEdge(edge: Edge): void {
    const encodedEdge = encodeEdge(edge)

    if (!this.map.has(edge.sourceId)) {
      this.map.set(edge.sourceId, new Set())
    }
    if (!this.map.has(edge.targetId)) {
      this.map.set(edge.targetId, new Set())
    }

    this.map.get(edge.sourceId)!.add(encodedEdge)
    this.map.get(edge.targetId)!.add(encodedEdge)
  }

  removeEdge(edge: Edge): void {
    const encodedEdge = encodeEdge(edge)
    this.map.get(edge.sourceId)?.delete(encodedEdge)
    this.map.get(edge.targetId)?.delete(encodedEdge)
  }

  getEdges(nodeId: number): Edge[] | undefined {
    const encodedEdges = this.map.get(nodeId)
    if (!encodedEdges) return undefined
    return Array.from(encodedEdges).map(decodeEdge)
  }
}
