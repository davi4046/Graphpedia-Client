import RBush from "rbush"
import { NodeBBox, Tile, TileEntry } from "./types"
import { PackedEdge, loadTile, unpackEdge } from "./utils"

export type EraseFn = () => void

export function createGraphUpdateHandler(
  queryTiles: (
    minX: number,
    minY: number,
    maxX: number,
    maxY: number
  ) => [TileEntry, Promise<Tile>][],

  drawNode: (x: number, y: number) => EraseFn,
  drawEdge: (x1: number, y1: number, x2: number, y2: number) => EraseFn
) {
  const loadedTiles = new Set<number>()
  const nodeIndex = new RBush<NodeBBox>()
  const nodePosMap = new Map<number, [x: number, y: number]>()
  const nodeEdgesMap = new Map<number, Set<PackedEdge>>()
  const drawnNodes = new Map<number, EraseFn>()
  const drawnEdges = new Map<PackedEdge, EraseFn>()

  return async (minX: number, minY: number, maxX: number, maxY: number) => {
    for (const [tileEntry, tilePromise] of queryTiles(minX, minY, maxX, maxY)) {
      if (loadedTiles.has(tileEntry.tileId)) continue
      loadedTiles.add(tileEntry.tileId)

      tilePromise.then((tile) => {
        loadTile(nodePosMap, nodeEdgesMap, nodeIndex, tile)
      })
    }

    const visibleNodes = nodeIndex.search({ minX, minY, maxX, maxY })
    const visibleNodeIds = new Set<number>()

    for (const { entityId, minX: nodeX, minY: nodeY } of visibleNodes) {
      visibleNodeIds.add(entityId)
      if (drawnNodes.has(entityId)) continue

      const eraseNode = drawNode(nodeX, nodeY)
      drawnNodes.set(entityId, eraseNode)

      const edges = nodeEdgesMap.get(entityId)!
      for (const edge of edges) {
        if (drawnEdges.has(edge)) continue

        const [sourceId, targetId] = unpackEdge(edge)

        let x1, y1, x2, y2

        if (entityId === sourceId) {
          ;[x1, y1] = [nodeX, nodeY]
          ;[x2, y2] = nodePosMap.get(targetId)!
        } else {
          ;[x1, y1] = nodePosMap.get(sourceId)!
          ;[x2, y2] = [nodeX, nodeY]
        }

        const eraseEdge = drawEdge(x1, y1, x2, y2)
        drawnEdges.set(edge, eraseEdge)
      }
    }

    for (const [entityId, eraseNode] of drawnNodes) {
      if (visibleNodeIds.has(entityId)) continue
      eraseNode()
      drawnNodes.delete(entityId)

      const edges = nodeEdgesMap.get(entityId)!
      for (const edge of edges) {
        const [sourceId, targetId] = unpackEdge(edge)
        const otherId = sourceId === entityId ? targetId : sourceId
        if (drawnNodes.has(otherId)) continue

        const eraseEdge = drawnEdges.get(edge)!
        eraseEdge()
        drawnEdges.delete(edge)
      }
    }
  }
}
