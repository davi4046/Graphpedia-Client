import { createAsync, useParams } from "@solidjs/router"
import { fetchGraphEntries } from "~/graph"
import GraphNotFoundPage from "~/pages/GraphNotFoundPage"
import GraphPage from "~/pages/GraphPage"

const getGraphList = async () => {
  "use server"
  return fetchGraphEntries()
}

export default function GraphRoute() {
  const params = useParams()

  const graphList = createAsync(getGraphList)
  const graphInfo = () => graphList()?.find((g) => g.id === params.graphId)

  return graphInfo() ? (
    <GraphPage graph={graphInfo()!} />
  ) : (
    <GraphNotFoundPage />
  )
}
