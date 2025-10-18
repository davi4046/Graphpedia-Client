import { createEffect, createSignal, onCleanup } from "solid-js"
import GraphEngine from "."
import GraphView from "./GraphView"
import { GraphTile } from "./types"

export function useGraphEngine(
  containerRef: () => HTMLElement | undefined,
  tiles: () => GraphTile[] | undefined
) {
  const [graphView, setGraphView] = createSignal<GraphView>()
  const [graphEngine, setGraphEngine] = createSignal<GraphEngine>()

  createEffect(async () => {
    const tileArray = tiles()
    const container = containerRef()
    if (!tileArray || !container || tileArray.length === 0) return

    const view = await GraphView.create(container)
    const engine = new GraphEngine(view, tileArray)
    setGraphView(view)
    setGraphEngine(engine)
  })

  onCleanup(() => {
    graphView()?.destroy()
    setGraphView(undefined)
    setGraphEngine(undefined)
  })

  return { graphView, graphEngine }
}
