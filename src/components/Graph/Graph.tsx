import { createSignal, onMount } from "solid-js"
import { GRAPH_DATA_URL } from "~/config"
import { GraphAdapter } from "./dataAdapter"
import { GraphpediaDataSource } from "./dataSource"
import { GraphTile } from "./GraphEngine/types"
import { useGraphEngine } from "./useGraphEngine"

export default function Graph(props: { graphId: string }) {
  let containerRef: HTMLDivElement | undefined
  const [tiles, setTiles] = createSignal<GraphTile[]>()

  onMount(async () => {
    const dataSource = new GraphpediaDataSource(GRAPH_DATA_URL, props.graphId)
    const graph = new GraphAdapter(dataSource)
    const result = await graph.tiles()
    setTiles(result)
  })

  useGraphEngine(() => containerRef, tiles)

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
}
