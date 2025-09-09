import { useParams } from "@solidjs/router"
import { createResource } from "solid-js"
import { BatchFetcher } from "./BatchFetcher"
import { EntityData, fetchEntities } from "./fetchEntities"
import { fetchTile, TileData } from "./fetchTile"
import { fetchTilesBBoxes, TileBBoxData } from "./fetchTilesBBoxes"
import { GraphViewOptions } from "./GraphEngine/GraphView"
import { GENodeData, GETile, GETileData } from "./GraphEngine/types"
import { useGraphEngine } from "./useGraphEngine"

const dataUrl = import.meta.env.PUBLIC_DATA_URL

const graphOptions: GraphViewOptions = {
  background: "white",
}

export default function Graph() {
  let containerRef: HTMLDivElement | undefined

  const params = useParams()
  const graphId = params.graphId

  const [tileBBoxArray] = createResource(() =>
    fetchTilesBBoxes(dataUrl, graphId)
  )

  const entityFetcher = new BatchFetcher(fetchEntities, 20)
  setInterval(() => entityFetcher.flush(), 1000)

  const getTileData = (tileId: number) => fetchTile(dataUrl, graphId, tileId)
  const getEntityData = (entityId: number) => entityFetcher.get(entityId)

  const engineTiles = () =>
    tileBBoxArray()?.map((bbox) =>
      createEngineTile(bbox, getTileData, getEntityData)
    ) ?? []

  useGraphEngine(() => containerRef, graphOptions, engineTiles)

  return (
    <div class="relative w-screen h-screen">
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  )
}

function createEngineTile(
  bbox: TileBBoxData,
  getTileData: (id: number) => Promise<TileData>,
  getEntityData: (id: number) => Promise<EntityData>
): GETile {
  const loadNode = async (id: number): Promise<GENodeData> => {
    const { name } = await getEntityData(id)
    return { label: name }
  }

  const loadTile = async (): Promise<GETileData> => {
    const { nodes, edges } = await getTileData(bbox.tileId)
    const nodeMap = new Map(
      nodes.map((n) => [
        n.entityId,
        {
          id: n.entityId.toString(),
          x: n.x,
          y: n.y,
          getData: () => loadNode(n.entityId),
        },
      ])
    )
    return {
      nodes: [...nodeMap.values()],
      edges: edges.map((e) => ({
        id: `${e.sourceId}-${e.targetId}`,
        source: nodeMap.get(e.sourceId)!,
        target: nodeMap.get(e.targetId)!,
      })),
    }
  }

  return { bbox, getData: loadTile }
}
