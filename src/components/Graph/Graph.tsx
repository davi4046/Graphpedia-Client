import { createSignal, onMount } from "solid-js"
import { GRAPH_DATA_URL } from "~/config"
import { useGraphList } from "~/pages/useGraphList"
import { GraphAdapter } from "./dataAdapter"
import { GraphpediaDataSource } from "./dataSource"
import { GraphTile } from "./GraphEngine/types"
import { useGraphEngine } from "./useGraphEngine"

export default function Graph(props: { graphId: string }) {
  let containerRef: HTMLDivElement | undefined
  const [tiles, setTiles] = createSignal<GraphTile[]>()

  const graphList = useGraphList()
  const graphInfo = () => graphList()?.find((g) => g.id === props.graphId)

  onMount(async () => {
    const dataSource = new GraphpediaDataSource(GRAPH_DATA_URL, props.graphId)
    const graph = new GraphAdapter(dataSource)
    const result = await graph.tiles()
    setTiles(result)
  })

  useGraphEngine(() => containerRef, tiles)

  return (
    <div class="relative h-full w-full">
      <div ref={containerRef} class="h-full w-full" />
      <div class="pointer-events-none absolute top-0 left-0 h-full w-full">
        <h1 class="m-4">{graphInfo()?.label}</h1>
      </div>
    </div>
  )
}
