import Flatbush from "flatbush"
import RBush from "rbush"
import EdgeView from "./EdgeView"
import GraphView from "./GraphView"
import NodeView from "./NodeView"
import { GEEdge, GENode, GETile, GETileData } from "./types"

export default class GraphEngine {
  private tileIndex: SpatialTileIndex
  private loadedTiles = new Set<GETile>()

  private nodeIndex = new SpatialNodeIndex()
  private nodeEdgesMap = new Map<GENode, Set<GEEdge>>()

  private renderedNodes = new Map<GENode, NodeView>()
  private renderedEdges = new Map<GEEdge, EdgeView>()

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
    this.graphView.onViewportZoomed(update)
  }

  private loadTilesInViewport() {
    const { minX, minY, maxX, maxY } = this.graphView.getVisibleBounds()
    const tilesInBounds = this.tileIndex.search(minX, minY, maxX, maxY)

    for (const tile of tilesInBounds) {
      if (this.loadedTiles.has(tile)) continue
      this.loadedTiles.add(tile)
      tile.getData().then((data) => this.loadTileData(data))
    }
  }

  private loadTileData(data: GETileData) {
    for (const node of data.nodes) {
      this.nodeIndex.insert(node)
    }
    for (const edge of data.edges) {
      if (!this.nodeEdgesMap.has(edge.source)) {
        this.nodeEdgesMap.set(edge.source, new Set())
      }
      if (!this.nodeEdgesMap.has(edge.target)) {
        this.nodeEdgesMap.set(edge.target, new Set())
      }
      this.nodeEdgesMap.get(edge.source)!.add(edge)
      this.nodeEdgesMap.get(edge.target)!.add(edge)
    }
  }

  private render() {
    const { minX, minY, maxX, maxY } = this.graphView.getVisibleBounds()
    const nodesInBounds = new Set(this.nodeIndex.search(minX, minY, maxX, maxY))

    for (const node of nodesInBounds) {
      if (!this.renderedNodes.has(node)) {
        const nodeView = this.graphView.addNode(node)
        this.renderedNodes.set(node, nodeView)

        const edges = this.nodeEdgesMap.get(node) || []

        for (const edge of edges) {
          if (!this.renderedEdges.has(edge)) {
            const edgeView = this.graphView.addEdge(edge.source, edge.target)
            this.renderedEdges.set(edge, edgeView)
          }
        }

        node.getData().then((data) => {
          nodeView.setLabel(data.label)
        })
      }
    }

    for (const [node, nodeView] of this.renderedNodes) {
      if (!nodesInBounds.has(node)) {
        nodeView.remove()
        this.renderedNodes.delete(node)

        const edges = this.nodeEdgesMap.get(node) || []

        for (const edge of edges) {
          if (
            !this.renderedNodes.has(edge.source) &&
            !this.renderedNodes.has(edge.target)
          ) {
            const edgeView = this.renderedEdges.get(edge)
            edgeView?.remove()
            this.renderedEdges.delete(edge)
          }
        }
      }
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
    node: GENode
  }> = new RBush()

  insert(node: GENode) {
    this.index.insert({
      minX: node.x,
      minY: node.y,
      maxX: node.x,
      maxY: node.y,
      node: node,
    })
  }

  search(minX: number, minY: number, maxX: number, maxY: number): GENode[] {
    return this.index
      .search({ minX, minY, maxX, maxY })
      .map((bbox) => bbox.node)
  }
}
