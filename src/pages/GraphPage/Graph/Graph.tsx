import {
  create,
  keyResolver,
  windowedFiniteBatchScheduler,
} from "@yornaath/batshit"
import { createResource } from "solid-js"
import { fetchEntities, WbEntityResponse } from "./fetchEntities"
import { fetchTile, TileData } from "./fetchTile"
import { fetchTilesBBoxes, TileBBoxData } from "./fetchTilesBBoxes"
import { GENodeData, GETile, GETileData } from "./GraphEngine/types"
import { useGraphEngine } from "./useGraphEngine"

export default function Graph(props: { graphId: string }) {
  let containerRef: HTMLDivElement | undefined

  const [tileBBoxArray] = createResource(() => fetchTilesBBoxes(props.graphId))

  const entities = create({
    fetcher: fetchEntities,
    resolver: keyResolver("id"),
    scheduler: windowedFiniteBatchScheduler({
      windowMs: 500,
      maxBatchSize: 50,
    }),
  })

  const getTileData = (id: number) => fetchTile(props.graphId, id)
  const getEntityData = (id: number) => entities.fetch(id)

  const engineTiles = () =>
    tileBBoxArray()?.map((bbox) =>
      createEngineTile(bbox, getTileData, getEntityData)
    ) ?? []

  useGraphEngine(() => containerRef, engineTiles)

  return (
    <div class="relative w-screen h-screen">
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  )
}

function createEngineTile(
  bbox: TileBBoxData,
  getTileData: (id: number) => Promise<TileData>,
  getEntityData: (id: number) => Promise<WbEntityResponse>
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
