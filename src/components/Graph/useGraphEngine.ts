import { createEffect, onCleanup } from "solid-js"
import GraphEngine from "./GraphEngine"
import GraphView from "./GraphEngine/GraphView"
import { GraphTile } from "./GraphEngine/types"

export function useGraphEngine(
  containerRef: () => HTMLDivElement | undefined,
  tiles: () => GraphTile[] | undefined
) {
  let graphView: GraphView | undefined
  let graphEngine: GraphEngine | undefined

  createEffect(async () => {
    const tileArray = tiles()
    const container = containerRef()
    if (!tileArray || !container || tileArray.length === 0) return

    graphView = await GraphView.create(container)
    graphEngine = new GraphEngine(graphView, tileArray)
  })

  onCleanup(() => {
    graphView?.destroy()
    graphEngine = undefined
    graphView = undefined
  })

  return { graphView, graphEngine }
}
