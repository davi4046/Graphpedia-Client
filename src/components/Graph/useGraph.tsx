import { createSignal, onMount } from "solid-js"
import { GRAPH_DATA_URL } from "~/config"
import { GraphDataAdapter } from "./dataAdapter"
import { GraphDataSource } from "./dataSource"
import { GraphTile } from "./GraphEngine/types"
import { useGraphEngine } from "./GraphEngine/useGraphEngine"

export default function useGraph(container: HTMLElement, graphId: string) {
  const [tiles, setTiles] = createSignal<GraphTile[]>()

  onMount(async () => {
    const dataSource = new GraphDataSource(GRAPH_DATA_URL, graphId)
    const dataAdapter = new GraphDataAdapter(dataSource)
    const result = await dataAdapter.tiles()
    setTiles(result)
  })

  return useGraphEngine(() => container, tiles)
}
