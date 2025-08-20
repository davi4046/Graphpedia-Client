import RBush from "rbush"
import {
  PackedUInt32Pair,
  packUInt32Pair,
  unpackUInt32Pair,
} from "~/utils/uint32pair"
import { Node, Tile, TileEntry } from "../types"

interface NodeBBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
  entityId: number
}

type PackedEdge = PackedUInt32Pair
const packEdge = packUInt32Pair
const unpackEdge = unpackUInt32Pair

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

export default class GraphDataManager {
  private loadedTiles = new Set<number>()
  private nodeIndex = new RBush<NodeBBox>()
  private nodePosMap = new Map<number, [x: number, y: number]>()
  private nodeEdgesMap = new Map<number, Set<PackedEdge>>()

  constructor(
    private queryTiles: (
      minX: number,
      minY: number,
      maxX: number,
      maxY: number
    ) => [TileEntry, Promise<Tile>][]
  ) {}

  async load(minX: number, minY: number, maxX: number, maxY: number) {
    const tileEntries = this.queryTiles(minX, minY, maxX, maxY)
    const tilePromises: Promise<void>[] = []

    for (const [tileEntry, tilePromise] of tileEntries) {
      if (this.loadedTiles.has(tileEntry.tileId)) continue
      this.loadedTiles.add(tileEntry.tileId)

      const loadPromise = tilePromise.then((tile) => {
        loadTile(this.nodePosMap, this.nodeEdgesMap, this.nodeIndex, tile)
      })

      tilePromises.push(loadPromise)
    }

    await Promise.all(tilePromises)
  }

  searchNodeIndex(
    minX: number,
    minY: number,
    maxX: number,
    maxY: number
  ): Node[] {
    const bboxResults = this.nodeIndex.search({ minX, minY, maxX, maxY })
    return bboxResults.map((bbox) => {
      return {
        entityId: bbox.entityId,
        x: bbox.minX,
        y: bbox.minY,
      }
    })
  }

  getNodePosition(entityId: number): [number, number] | undefined {
    const position = this.nodePosMap.get(entityId)
    return position ? [...position] : undefined
  }

  getNodeEdges(entityId: number): [number, number][] | undefined {
    const edges = this.nodeEdgesMap.get(entityId)
    if (!edges) return undefined
    return Array.from(edges).map((edge) => unpackEdge(edge))
  }
}
