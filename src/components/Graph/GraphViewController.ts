import RBush from "rbush"
import { NodeBBox, Tile, TileEntry } from "./types"

type PackedEdge = bigint & { __brand: "PackedEdge" }

function packEdge(sourceId: number, targetId: number): PackedEdge {
  // Both sourceId and targetId are 32-bit unsigned integers
  const edgeHash = (BigInt(sourceId) << 32n) | BigInt(targetId)
  return edgeHash as PackedEdge
}

function unpackEdge(packedEdge: PackedEdge): [number, number] {
  const sourceId = Number(packedEdge >> 32n)
  const targetId = Number(packedEdge & 0xffffffffn)
  return [sourceId, targetId]
}

function loadTile(
  nodePosMap: Map<number, [number, number]>,
  nodeEdgesMap: Map<number, Set<PackedEdge>>,
  nodeIndex: RBush<NodeBBox>,
  tile: Tile
) {
  const { nodes, edges } = tile
  for (const node of nodes) {
    nodePosMap.set(node.entityId, [node.x, node.y])

    const nodeBBox: NodeBBox = {
      minX: node.x,
      minY: node.y,
      maxX: node.x,
      maxY: node.y,
      entityId: node.entityId,
    }
    nodeIndex.insert(nodeBBox)
  }
  for (const { sourceId, targetId } of edges) {
    const edge = packEdge(sourceId, targetId)

    if (!nodeEdgesMap.has(sourceId)) {
      nodeEdgesMap.set(sourceId, new Set())
    }
    nodeEdgesMap.get(sourceId)!.add(edge)

    if (!nodeEdgesMap.has(targetId)) {
      nodeEdgesMap.set(targetId, new Set())
    }
    nodeEdgesMap.get(targetId)!.add(edge)
  }
}

export type EraseFn = () => void

export class GraphViewController {
  private loadedTiles = new Set<number>()
  private nodeIndex = new RBush<NodeBBox>()
  private nodePosMap = new Map<number, [x: number, y: number]>()
  private nodeEdgesMap = new Map<number, Set<PackedEdge>>()
  private drawnNodes = new Map<number, EraseFn>()
  private drawnEdges = new Map<PackedEdge, EraseFn>()

  constructor(
    private queryTiles: (
      minX: number,
      minY: number,
      maxX: number,
      maxY: number
    ) => [TileEntry, Promise<Tile>][],
    private drawNode: (x: number, y: number) => EraseFn,
    private drawEdge: (
      x1: number,
      y1: number,
      x2: number,
      y2: number
    ) => EraseFn
  ) {}

  async update(minX: number, minY: number, maxX: number, maxY: number) {
    // Load tiles that are currently visible
    for (const [tileEntry, tilePromise] of this.queryTiles(
      minX,
      minY,
      maxX,
      maxY
    )) {
      if (this.loadedTiles.has(tileEntry.tileId)) continue
      this.loadedTiles.add(tileEntry.tileId)

      tilePromise.then((tile) => {
        loadTile(this.nodePosMap, this.nodeEdgesMap, this.nodeIndex, tile)
      })
    }

    const visibleNodes = this.nodeIndex.search({ minX, minY, maxX, maxY })
    const visibleNodeIds = new Set<number>()

    // Draw nodes and edges that are currently visible
    for (const { entityId, minX: nodeX, minY: nodeY } of visibleNodes) {
      visibleNodeIds.add(entityId)
      if (this.drawnNodes.has(entityId)) continue

      const eraseNode = this.drawNode(nodeX, nodeY)
      this.drawnNodes.set(entityId, eraseNode)

      const edges = this.nodeEdgesMap.get(entityId)!
      for (const edge of edges) {
        if (this.drawnEdges.has(edge)) continue

        const [sourceId, targetId] = unpackEdge(edge)

        let x1, y1, x2, y2

        if (entityId === sourceId) {
          ;[x1, y1] = [nodeX, nodeY]
          ;[x2, y2] = this.nodePosMap.get(targetId)!
        } else {
          ;[x1, y1] = this.nodePosMap.get(sourceId)!
          ;[x2, y2] = [nodeX, nodeY]
        }

        const eraseEdge = this.drawEdge(x1, y1, x2, y2)
        this.drawnEdges.set(edge, eraseEdge)
      }
    }

    // Remove nodes and edges that are no longer visible
    for (const [entityId, eraseNode] of this.drawnNodes) {
      if (visibleNodeIds.has(entityId)) continue
      eraseNode()
      this.drawnNodes.delete(entityId)

      const edges = this.nodeEdgesMap.get(entityId)!
      for (const edge of edges) {
        const [sourceId, targetId] = unpackEdge(edge)
        const otherId = sourceId === entityId ? targetId : sourceId
        if (this.drawnNodes.has(otherId)) continue

        const eraseEdge = this.drawnEdges.get(edge)!
        eraseEdge()
        this.drawnEdges.delete(edge)
      }
    }
  }
}
