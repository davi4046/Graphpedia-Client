import { Link } from "@solidjs/meta"
import { useParams } from "@solidjs/router"
import Graph from "../components/Graph"

export default function GraphPage() {
  const params = useParams()
  return (
    <>
      <Link rel="canonical" href={`/graph/${params.graphId}`} />
      <div style="height: 100vh; width: 100vw;">
        <Graph graphId={params.graphId} />
      </div>
    </>
  )
}
