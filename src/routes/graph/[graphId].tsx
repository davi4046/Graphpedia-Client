import { useParams } from "@solidjs/router"
import { ErrorBoundary, Show } from "solid-js"
import useGraphList from "~/hooks/useGraphList"
import GraphPage from "~/pages/GraphPage"
import NotFoundPage from "~/pages/NotFoundPage"

export default function GraphRoute() {
  const params = useParams()
  const graphList = useGraphList()

  const graphInfo = () => graphList()?.find((g) => g.id === params.graphId)

  return (
    <Show when={graphInfo()} fallback={<NotFoundPage />}>
      <ErrorBoundary
        fallback={(err) => (
          <div class="flex h-screen items-center justify-center">
            <div class="rounded-lg bg-red-50 p-4 text-red-800">
              <strong>Error loading graph:</strong> {err.message}
            </div>
          </div>
        )}
      >
        <GraphPage graph={graphInfo()!} />
      </ErrorBoundary>
    </Show>
  )
}
