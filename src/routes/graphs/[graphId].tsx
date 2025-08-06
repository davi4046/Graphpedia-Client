import { useParams } from "@solidjs/router"
import Graph from "~/components/Graph"

export default function GraphPage() {
  const params = useParams()

  return (
    <div>
      <Graph graphId={params.graphId} />
    </div>
  )
}
