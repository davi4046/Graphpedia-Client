import { createAsync } from "@solidjs/router"
import { Accessor } from "solid-js"
import {
  GraphDataAdapter,
  GraphDataSource,
  GraphEngine,
  GraphView,
} from "~/graph"

export default function useGraphEngine(
  graphView: Accessor<GraphView | undefined>,
  dataSource: Accessor<GraphDataSource | undefined>
) {
  const graphEngine = createAsync(async () => {
    const view = graphView()
    const source = dataSource()
    if (!view || !source) return
    const adapter = new GraphDataAdapter(source)
    const tiles = await adapter.tiles()
    return new GraphEngine(view, tiles)
  })

  return graphEngine
}
