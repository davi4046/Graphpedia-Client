import { createEffect, onCleanup } from "solid-js"
import GraphEngine from "./GraphEngine"
import GraphView, { GraphViewOptions } from "./GraphEngine/GraphView"
import { GETile } from "./GraphEngine/types"

export function useGraphEngine(
  containerRef: () => HTMLDivElement | undefined,
  graphOptions: GraphViewOptions,
  tiles: () => GETile[]
) {
  let graphView: GraphView | undefined
  let graphEngine: GraphEngine | undefined

  createEffect(async () => {
    const tileArray = tiles()
    const container = containerRef()
    if (!tileArray || !container) return

    graphView = await GraphView.create(container, graphOptions)
    graphEngine = new GraphEngine(graphView, tileArray)
  })

  onCleanup(() => {
    graphView?.destroy()
    graphEngine = undefined
    graphView = undefined
  })

  return { graphView, graphEngine }
}
