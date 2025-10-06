import Flatbush from "flatbush"
import RBush from "rbush"
import EdgeView from "./EdgeView"
import GraphView from "./GraphView"
import NodeView from "./NodeView"
import {
  EdgeId,
  GEEdge,
  GENode,
  GENodeData,
  GETile,
  GETileData,
  NodeId,
} from "./types"

export default class GraphEngine {
  private tileIndex: SpatialTileIndex
  private loadedTiles = new Set<GETile>()

  private nodes = new Map<NodeId, GENode>()
  private edges = new Map<EdgeId, GEEdge>()

  private nodeIndex = new SpatialNodeIndex()
  private nodeEdgesMap = new Map<NodeId, Set<EdgeId>>()

  private renderedNodes = new Map<NodeId, NodeView>()
  private renderedEdges = new Map<EdgeId, EdgeView>()

  constructor(
    private graphView: GraphView,
    private tiles: GETile[]
  ) {
    this.tileIndex = new SpatialTileIndex(this.tiles)

    const update = async () => {
      this.loadTilesInViewport()
      this.render()
    }

    this.graphView.onViewportMoved(update)

    // Use "zoomed-end" instead of "zoomed" to ensure the handler is called
    // only after the zoom animation is fully complete and the viewport bounds
    // are stable. Using "zoomed" would trigger the handler multiple times
    // during the zoom animation, potentially with intermediate or inaccurate
    // bounds, which can cause issues like nodes temporarily disappearing
    // ("popping") due to transient empty search results. "zoomed-end" avoids
    // these problems by firing only once, with the final, correct bounds.
    this.graphView.onViewportZoomedEnd(update)

    // Initial load
    this.loadTilesInViewport()
  }

  private loadTilesInViewport() {
    const { minX, minY, maxX, maxY } = this.graphView.getVisibleBounds()
    const tilesInBounds = this.tileIndex.search(minX, minY, maxX, maxY)

    for (const tile of tilesInBounds) {
      if (this.loadedTiles.has(tile)) continue
      this.loadedTiles.add(tile)
      tile.getData().then((data) => {
        this.loadTileData(data)
        this.render()
      })
    }
  }

  private loadTileData(data: GETileData) {
    for (const node of data.nodes) {
      this.nodes.set(node.id, node)
      this.nodeIndex.insert(node)
    }
    for (const edge of data.edges) {
      this.edges.set(edge.id, edge)

      if (!this.nodeEdgesMap.has(edge.source.id)) {
        this.nodeEdgesMap.set(edge.source.id, new Set())
      }
      if (!this.nodeEdgesMap.has(edge.target.id)) {
        this.nodeEdgesMap.set(edge.target.id, new Set())
      }

      this.nodeEdgesMap.get(edge.source.id)!.add(edge.id)
      this.nodeEdgesMap.get(edge.target.id)!.add(edge.id)
    }
  }

  private render() {
    const { minX, minY, maxX, maxY } = this.graphView.getVisibleBounds()
    const nodesInBounds = new Set(this.nodeIndex.search(minX, minY, maxX, maxY))

    for (const nodeId of nodesInBounds) {
      if (!this.renderedNodes.has(nodeId)) {
        const node = this.nodes.get(nodeId)!
        const nodeView = this.graphView.addNode(node.id, node.x, node.y)
        this.renderedNodes.set(nodeId, nodeView)

        const edgeIds = this.nodeEdgesMap.get(nodeId) || []

        for (const edgeId of edgeIds) {
          if (!this.renderedEdges.has(edgeId)) {
            const edge = this.edges.get(edgeId)!
            const source = this.renderedNodes.get(edge.source.id)
            const target = this.renderedNodes.get(edge.target.id)
            if (!source || !target) continue
            const edgeView = this.graphView.addEdge(source, target)
            this.renderedEdges.set(edgeId, edgeView)
          }
        }

        node.getData().then((data) => this.updateNodesAndEdges(node, data))
      }
    }

    for (const [nodeId, nodeView] of this.renderedNodes) {
      if (!nodesInBounds.has(nodeId)) {
        nodeView.remove()
        this.renderedNodes.delete(nodeId)

        const edgeIds = this.nodeEdgesMap.get(nodeId) || []

        for (const edgeId of edgeIds) {
          const edge = this.edges.get(edgeId)!
          if (
            !this.renderedNodes.has(edge.source.id) &&
            !this.renderedNodes.has(edge.target.id)
          ) {
            const edgeView = this.renderedEdges.get(edgeId)
            edgeView?.remove()
            this.renderedEdges.delete(edgeId)
          }
        }
      }
    }
  }

  private updateNodesAndEdges(node: GENode, data: GENodeData) {
    const oldNodeView = this.renderedNodes.get(node.id)
    if (!oldNodeView) return
    const newNodeView = this.graphView.addNode(data.label, node.x, node.y)
    this.renderedNodes.set(node.id, newNodeView)
    oldNodeView.remove()

    const edgeIds = this.nodeEdgesMap.get(node.id) || []

    for (const edgeId of edgeIds) {
      const oldEdgeView = this.renderedEdges.get(edgeId)
      if (!oldEdgeView) continue
      const edge = this.edges.get(edgeId)!
      const source = this.renderedNodes.get(edge.source.id)
      const target = this.renderedNodes.get(edge.target.id)
      if (!source || !target) continue
      const newEdgeView = this.graphView.addEdge(source, target)
      this.renderedEdges.set(edgeId, newEdgeView)
      oldEdgeView.remove()
    }
  }
}

class SpatialTileIndex {
  private index: Flatbush
  private tiles: GETile[]

  constructor(tiles: GETile[]) {
    this.index = new Flatbush(tiles.length)
    this.tiles = tiles

    for (const entry of this.tiles) {
      this.index.add(
        entry.bbox.minX,
        entry.bbox.minY,
        entry.bbox.maxX,
        entry.bbox.maxY
      )
    }
    this.index.finish()
  }

  search(minX: number, minY: number, maxX: number, maxY: number): GETile[] {
    const ids = this.index.search(minX, minY, maxX, maxY)
    return ids.map((i) => this.tiles[i])
  }
}

class SpatialNodeIndex {
  private index: RBush<{
    minX: number
    minY: number
    maxX: number
    maxY: number
    nodeId: NodeId
  }> = new RBush()

  insert(node: GENode) {
    this.index.insert({
      minX: node.x,
      minY: node.y,
      maxX: node.x,
      maxY: node.y,
      nodeId: node.id,
    })
  }

  search(minX: number, minY: number, maxX: number, maxY: number): NodeId[] {
    return this.index
      .search({ minX, minY, maxX, maxY })
      .map((bbox) => bbox.nodeId)
  }
}
