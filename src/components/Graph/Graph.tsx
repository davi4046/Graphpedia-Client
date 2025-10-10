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
      <div class="absolute top-0 left-0">
        <a
          href="/"
          class="flex flex-col items-center gap-0.5 bg-white shadow-sm"
        >
          <img src="/graphpedia.svg" class="h-14 w-14" />
          <img src="/graphpedia-wordmark.svg" class="h-auto w-14" />
        </a>
      </div>
      <div class="absolute top-0 left-1/2 -translate-x-1/2 border-x border-b border-gray-300 bg-white px-1 shadow-sm">
        <h1 class="mb-0 text-lg font-semibold">
          {graphInfo()?.label} ({graphInfo()?.id})
        </h1>
      </div>
    </div>
  )
}
