import Flatbush from "flatbush"
import RBush, { BBox } from "rbush"
import EdgeView from "./EdgeView"
import GraphView, { NodeViewMeta } from "./GraphView"
import NodeView from "./NodeView"

export interface GraphNode {
  readonly id: number
  readonly x: number
  readonly y: number
  getDetails(): Promise<{
    label: string
    description: string
  }>
}

export interface GraphEdge {
  readonly sourceId: number
  readonly targetId: number
}

export interface GraphTile {
  readonly id: number
  readonly bbox: BBox
  getDetails(): Promise<{
    nodes: GraphNode[]
    edges: GraphEdge[]
  }>
}

export default class GraphEngine {
  private tileIndex: SpatialTileIndex
  private loadedTiles = new Set<number>()

  private nodes = new Map<number, GraphNode>()
  private edges = new EdgeMap<GraphEdge>()

  private nodeIndex = new SpatialNodeIndex()
  private nodeTargetsMap = new Map<number, Set<number>>()
  private nodeSourcesMap = new Map<number, Set<number>>()

  private renderedNodes = new Map<number, NodeView | undefined>()
  private renderedEdges = new EdgeMap<EdgeView>()

  constructor(
    private view: GraphView,
    private tiles: GraphTile[]
  ) {
    this.tileIndex = new SpatialTileIndex(this.tiles)

    const update = () => {
      this.loadTilesInViewport()
      this.render()
    }

    this.view.on("viewportMoved", update)
    this.loadTilesInViewport() // Initial load
  }

  private loadTilesInViewport() {
    const { minX, minY, maxX, maxY } = this.view.getVisibleBounds()
    const tilesInBounds = this.tileIndex.search(minX, minY, maxX, maxY)

    for (const tile of tilesInBounds) {
      if (this.loadedTiles.has(tile.id)) continue
      this.loadedTiles.add(tile.id)

      tile.getDetails().then(({ nodes, edges }) => {
        for (const node of nodes) {
          if (this.nodes.has(node.id)) continue
          this.nodes.set(node.id, node)
          this.nodeIndex.insert(node)
        }

        for (const edge of edges) {
          if (this.edges.get(edge.sourceId, edge.targetId)) continue
          this.edges.set(edge.sourceId, edge.targetId, edge)

          if (!this.nodeTargetsMap.has(edge.sourceId)) {
            this.nodeTargetsMap.set(edge.sourceId, new Set())
          }
          this.nodeTargetsMap.get(edge.sourceId)!.add(edge.targetId)

          if (!this.nodeSourcesMap.has(edge.targetId)) {
            this.nodeSourcesMap.set(edge.targetId, new Set())
          }
          this.nodeSourcesMap.get(edge.targetId)!.add(edge.sourceId)
        }

        this.render()
      })
    }
  }

  private render() {
    const { minX, minY, maxX, maxY } = this.view.getVisibleBounds()
    const nodesInBounds = new Set(this.nodeIndex.search(minX, minY, maxX, maxY))

    for (const nodeId of nodesInBounds) {
      if (this.renderedNodes.has(nodeId)) continue
      this.renderedNodes.set(nodeId, undefined)

      const node = this.nodes.get(nodeId)!

      node.getDetails().then(({ label, description }) => {
        if (!this.renderedNodes.has(nodeId)) return

        const props = {
          x: node.x,
          y: node.y,
          label,
          description,
        }

        const meta = new NodeViewMetaImpl(
          nodeId,
          this.nodeTargetsMap,
          this.nodeSourcesMap,
          this.renderedEdges
        )

        const nodeView = this.view.addNode(props, meta)
        this.renderedNodes.set(nodeId, nodeView)

        const nodeTargets = this.nodeTargetsMap.get(nodeId) || new Set()
        const nodeSources = this.nodeSourcesMap.get(nodeId) || new Set()

        for (const targetId of nodeTargets) {
          if (!this.renderedNodes.has(targetId)) continue
          if (this.renderedEdges.get(nodeId, targetId)) continue
          const target = this.renderedNodes.get(targetId)
          if (!target) continue
          const edgeView = this.view.addEdge(nodeView, target)
          this.renderedEdges.set(nodeId, targetId, edgeView)
        }

        for (const sourceId of nodeSources) {
          if (!this.renderedNodes.has(sourceId)) continue
          if (this.renderedEdges.get(sourceId, nodeId)) continue
          const source = this.renderedNodes.get(sourceId)
          if (!source) continue
          const edgeView = this.view.addEdge(source, nodeView)
          this.renderedEdges.set(sourceId, nodeId, edgeView)
        }
      })
    }

    for (const [nodeId, nodeView] of this.renderedNodes) {
      if (nodesInBounds.has(nodeId)) continue

      nodeView?.removeFromParent()
      this.renderedNodes.delete(nodeId)

      const nodeTargets = this.nodeTargetsMap.get(nodeId) || new Set()
      const nodeSources = this.nodeSourcesMap.get(nodeId) || new Set()

      for (const targetId of nodeTargets) {
        if (!this.renderedNodes.has(targetId)) continue
        const edgeView = this.renderedEdges.get(nodeId, targetId)
        edgeView?.removeFromParent()
        this.renderedEdges.delete(nodeId, targetId)
      }

      for (const sourceId of nodeSources) {
        if (!this.renderedNodes.has(sourceId)) continue
        const edgeView = this.renderedEdges.get(sourceId, nodeId)
        edgeView?.removeFromParent()
        this.renderedEdges.delete(sourceId, nodeId)
      }
    }
  }
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

class NodeViewMetaImpl implements NodeViewMeta {
  constructor(
    private nodeId: number,
    private nodeTargetsMap: Map<number, Set<number>>,
    private nodeSourcesMap: Map<number, Set<number>>,
    private renderedEdges: EdgeMap<EdgeView>
  ) {}

  get outgoingEdges(): EdgeView[] {
    const targets = this.nodeTargetsMap.get(this.nodeId) || new Set()
    const edges: EdgeView[] = []
    for (const targetId of targets) {
      const edgeView = this.renderedEdges.get(this.nodeId, targetId)
      if (edgeView) edges.push(edgeView)
    }
    return edges
  }

  get incomingEdges(): EdgeView[] {
    const sources = this.nodeSourcesMap.get(this.nodeId) || new Set()
    const edges: EdgeView[] = []
    for (const sourceId of sources) {
      const edgeView = this.renderedEdges.get(sourceId, this.nodeId)
      if (edgeView) edges.push(edgeView)
    }
    return edges
  }
}
