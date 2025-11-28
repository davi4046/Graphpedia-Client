import { debounce } from "@solid-primitives/scheduled"
import { Accessor, createEffect, createSignal, onCleanup } from "solid-js"
import { GraphView } from "~/graph"

type Viewport = {
  x: number
  y: number
  zoom: number
}

export default function useViewportSave(
  graphView: Accessor<GraphView | undefined>,
  graphId: string
) {
  const saveViewport = (viewport: Viewport) => {
    const data = JSON.stringify(viewport)
    localStorage.setItem(`graph-viewport-${graphId}`, data)
  }

  const loadViewport = () => {
    const data = localStorage.getItem(`graph-viewport-${graphId}`)
    return data ? JSON.parse(data) : null
  }

  const [viewport, setViewport] = createSignal<Viewport>()

  createEffect(() => {
    const view = graphView()
    if (!view) return

    const savedViewport = loadViewport()
    if (savedViewport) {
      setViewport(savedViewport)
    }

    const debouncedSave = debounce(() => {
      const currentViewport = view.getViewportCenter()
      saveViewport(currentViewport)
    }, 500)

    view.on("viewportMoved", debouncedSave)

    onCleanup(() => {
      view.off("viewportMoved", debouncedSave)
    })
  })

  return viewport
}
