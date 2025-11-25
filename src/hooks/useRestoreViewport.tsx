import { debounce } from "@solid-primitives/scheduled"
import { createEffect } from "solid-js"
import { GraphView } from "~/graph"

function saveViewportState(graphView: GraphView, graphId: string) {
  const state = graphView.getViewportCenter()
  localStorage.setItem(`graph-viewport-${graphId}`, JSON.stringify(state))
}

function loadViewportState(graphView: GraphView, graphId: string) {
  const saved = localStorage.getItem(`graph-viewport-${graphId}`)
  const state = saved ? JSON.parse(saved) : null
  if (state) graphView.setViewportCenter(state.x, state.y, state.zoom)
}

export default function useRestoreViewport(
  graphView: () => GraphView | undefined,
  graphId: string
) {
  createEffect(() => {
    const view = graphView()
    if (!view) return

    const debouncedSave = debounce(() => {
      saveViewportState(view, graphId)
    }, 500)

    view.on("viewportMoved", debouncedSave)
  })

  const restoreViewport = () => {
    const view = graphView()
    if (view) loadViewportState(view, graphId)
  }

  return { restoreViewport }
}
