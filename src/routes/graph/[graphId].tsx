import { useParams } from "@solidjs/router"
import { Show } from "solid-js"
import useGraphList from "~/hooks/useGraphList"
import GraphPage from "~/pages/GraphPage"
import NotFoundPage from "~/pages/NotFoundPage"

export default function GraphRoute() {
  const params = useParams()
  const graphList = useGraphList()

  const graphInfo = () => graphList()?.find((g) => g.id === params.graphId)

  return (
    <Show when={graphInfo()} fallback={<NotFoundPage />}>
      <GraphPage graph={graphInfo()!} />
    </Show>
  )
}
