import Flatbush from "flatbush"
import RBush from "rbush"
import { GraphNode, GraphTile } from "./dataAdapter"
import GraphState from "./GraphState"
import GraphView from "./GraphView"

export default class GraphEngine {
  private tileIndex: SpatialTileIndex
  private loadedTiles = new Set<number>()
  private nodeIndex = new SpatialNodeIndex()

  constructor(
    private state: GraphState,
    private view: GraphView,
    private tiles: GraphTile[]
  ) {
    this.tileIndex = new SpatialTileIndex(this.tiles)

    const update = () => {
      this.loadTilesInViewport()
      this.render()
    }

    this.view.onViewportMoved(update)
    this.loadTilesInViewport() // Initial load
  }

  private loadTilesInViewport() {
    const { minX, minY, maxX, maxY } = this.view.getVisibleBounds()
    const tilesInBounds = this.tileIndex.search(minX, minY, maxX, maxY)

    for (const tile of tilesInBounds) {
      if (this.loadedTiles.has(tile.id)) continue
      this.loadedTiles.add(tile.id)

      Promise.all([tile.nodes(), tile.edges()]).then(([nodes, edges]) => {
        for (const node of nodes) {
          if (this.state.nodes.has(node.id)) continue
          this.state.nodes.set(node.id, node)
          this.nodeIndex.insert(node)
        }

        for (const edge of edges) {
          if (this.state.edges.get(edge.sourceId, edge.targetId)) continue
          this.state.edges.set(edge.sourceId, edge.targetId, edge)

          if (!this.state.nodeTargetsMap.has(edge.sourceId)) {
            this.state.nodeTargetsMap.set(edge.sourceId, new Set())
          }
          this.state.nodeTargetsMap.get(edge.sourceId)!.add(edge.targetId)

          if (!this.state.nodeSourcesMap.has(edge.targetId)) {
            this.state.nodeSourcesMap.set(edge.targetId, new Set())
          }
          this.state.nodeSourcesMap.get(edge.targetId)!.add(edge.sourceId)
        }

        this.render()
      })
    }
  }

  private render() {
    const { minX, minY, maxX, maxY } = this.view.getVisibleBounds()
    const nodesInBounds = new Set(this.nodeIndex.search(minX, minY, maxX, maxY))

    for (const nodeId of nodesInBounds) {
      if (this.state.renderedNodes.has(nodeId)) continue
      this.state.renderedNodes.set(nodeId, undefined)

      const node = this.state.nodes.get(nodeId)!

      node.label().then((label) => {
        if (!this.state.renderedNodes.has(nodeId)) return

        const nodeView = this.view.addNode(node.x, node.y, label)
        this.state.renderedNodes.set(nodeId, nodeView)

        const nodeTargets = this.state.nodeTargetsMap.get(nodeId) || new Set()
        const nodeSources = this.state.nodeSourcesMap.get(nodeId) || new Set()

        for (const targetId of nodeTargets) {
          if (!this.state.renderedNodes.has(targetId)) continue
          if (this.state.renderedEdges.get(nodeId, targetId)) continue
          const target = this.state.renderedNodes.get(targetId)
          if (!target) continue
          const edgeView = this.view.addEdge(nodeView, target)
          this.state.renderedEdges.set(nodeId, targetId, edgeView)
        }

        for (const sourceId of nodeSources) {
          if (!this.state.renderedNodes.has(sourceId)) continue
          if (this.state.renderedEdges.get(sourceId, nodeId)) continue
          const source = this.state.renderedNodes.get(sourceId)
          if (!source) continue
          const edgeView = this.view.addEdge(source, nodeView)
          this.state.renderedEdges.set(sourceId, nodeId, edgeView)
        }
      })
    }

    for (const [nodeId, nodeView] of this.state.renderedNodes) {
      if (nodesInBounds.has(nodeId)) continue

      nodeView?.removeFromParent()
      this.state.renderedNodes.delete(nodeId)

      const nodeTargets = this.state.nodeTargetsMap.get(nodeId) || new Set()
      const nodeSources = this.state.nodeSourcesMap.get(nodeId) || new Set()

      for (const targetId of nodeTargets) {
        if (!this.state.renderedNodes.has(targetId)) continue
        const edgeView = this.state.renderedEdges.get(nodeId, targetId)
        edgeView?.removeFromParent()
        this.state.renderedEdges.delete(nodeId, targetId)
      }

      for (const sourceId of nodeSources) {
        if (!this.state.renderedNodes.has(sourceId)) continue
        const edgeView = this.state.renderedEdges.get(sourceId, nodeId)
        edgeView?.removeFromParent()
        this.state.renderedEdges.delete(sourceId, nodeId)
      }
    }
  }
}

class SpatialTileIndex {
  private index: Flatbush
  private tiles: GraphTile[]

  constructor(tiles: GraphTile[]) {
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

  search(minX: number, minY: number, maxX: number, maxY: number): GraphTile[] {
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
    nodeId: number
  }> = new RBush()

  insert(node: GraphNode) {
    this.index.insert({
      minX: node.x,
      minY: node.y,
      maxX: node.x,
      maxY: node.y,
      nodeId: node.id,
    })
  }

  search(minX: number, minY: number, maxX: number, maxY: number): number[] {
    return this.index
      .search({ minX, minY, maxX, maxY })
      .map((bbox) => bbox.nodeId)
  }
}
