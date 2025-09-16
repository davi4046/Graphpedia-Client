import { useParams } from "@solidjs/router"
import Graph from "./Graph"

export default function GraphPage() {
  const params = useParams()
  return <Graph graphId={params.graphId} />
}
