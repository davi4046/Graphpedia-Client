import { createAsync, query } from "@solidjs/router"
import { fetchGraphsIndex } from "~/graph"

const getGraphList = query(() => {
  return fetchGraphsIndex()
}, "graphList")

export default function useGraphList() {
  const graphList = createAsync(() => getGraphList(), { deferStream: true })
  return graphList
}
