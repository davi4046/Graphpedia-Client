import { useParams } from "@solidjs/router"
import { Show } from "solid-js"
import useGraphList from "~/hooks/useGraphList"
import GraphNotFound from "~/pages/GraphNotFound"
import GraphPage from "~/pages/GraphPage"

export default function GraphRoute() {
  const params = useParams()

  const graphList = useGraphList()
  const graphInfo = () => graphList()?.find((g) => g.id === params.graphId)

  return (
    <Show when={graphInfo()} fallback={<GraphNotFound />}>
      <GraphPage graph={graphInfo()!} />
    </Show>
  )
}
