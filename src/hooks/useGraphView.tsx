import { Accessor, createSignal, onCleanup, onMount } from "solid-js"
import { GraphView } from "~/graph"

export default function useGraphView(
  containerRef: Accessor<HTMLElement | undefined>
) {
  const [graphView, setGraphView] = createSignal<GraphView>()
  const [zoom, setZoom] = createSignal<number>(1)

  onMount(async () => {
    const container = containerRef()
    if (!container) return
    const view = await GraphView.create(container)
    setGraphView(view)
    setZoom(view.getZoom())
    view.on("viewportMoved", () => setZoom(view.getZoom()))
  })

  onCleanup(() => graphView()?.destroy())

  return { graphView, zoom }
}
