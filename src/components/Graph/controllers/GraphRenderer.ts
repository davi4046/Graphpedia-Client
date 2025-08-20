import { packUInt32Pair } from "~/utils/uint32pair"
import { DrawHandle } from "../types"
import GraphDataManager from "./GraphDataManager"

type drawNode = (entityId: number, x: number, y: number) => DrawHandle
type drawEdge = (x1: number, y1: number, x2: number, y2: number) => DrawHandle

export default class GraphRenderer {
  private drawnNodes = new Map<number, DrawHandle>()
  private drawnEdges = new Map<bigint, DrawHandle>()

  constructor(
    private dataManager: GraphDataManager,
    private drawNode: drawNode,
    private drawEdge: drawEdge
  ) {}

  render(minX: number, minY: number, maxX: number, maxY: number) {
    // Query visible nodes from the data manager
    const visibleNodes = this.dataManager.searchNodeIndex(
      minX,
      minY,
      maxX,
      maxY
    )
    const visibleNodeIds = new Set<number>()

    // Draw nodes and edges
    for (const node of visibleNodes) {
      visibleNodeIds.add(node.entityId)
      if (!this.drawnNodes.has(node.entityId)) {
        const nodeHandle = this.drawNode(node.entityId, node.x, node.y)
        this.drawnNodes.set(node.entityId, nodeHandle)
      }

      const edges = this.dataManager.getNodeEdges(node.entityId) ?? []
      for (const [sourceId, targetId] of edges) {
        const edgeKey = packUInt32Pair(sourceId, targetId)
        if (this.drawnEdges.has(edgeKey)) continue

        const [x1, y1] = this.dataManager.getNodePosition(sourceId)!
        const [x2, y2] = this.dataManager.getNodePosition(targetId)!
        const edgeHandle = this.drawEdge(x1, y1, x2, y2)
        this.drawnEdges.set(edgeKey, edgeHandle)
      }
    }

    // Cull nodes and edges no longer visible
    for (const [entityId, nodeHandle] of this.drawnNodes) {
      if (visibleNodeIds.has(entityId)) continue
      nodeHandle.remove()
      this.drawnNodes.delete(entityId)

      const edges = this.dataManager.getNodeEdges(entityId) ?? []
      for (const [sourceId, targetId] of edges) {
        const otherId = sourceId === entityId ? targetId : sourceId
        if (this.drawnNodes.has(otherId)) continue

        const edgeKey = packUInt32Pair(sourceId, targetId)
        const edgeHandle = this.drawnEdges.get(edgeKey)
        edgeHandle?.remove()
        this.drawnEdges.delete(edgeKey)
      }
    }
  }
}
