import { useNavigate, useParams } from "@solidjs/router"
import { onMount } from "solid-js"
import Graph from "~/components/Graph"

export default function GraphPage() {
  const params = useParams()
  const navigate = useNavigate()

  const [graphId, graphName] = parseSlug(params.graph)
  const [focusId, focusName] = parseSlug(params.focus)

  onMount(() => {
    if (!graphId) {
      navigate("/404", { replace: true })
    }
  })

  return graphId ? <Graph graphId={graphId} /> : null
}

function parseSlug(slug?: string): [string | undefined, string | undefined] {
  if (!slug) return [undefined, undefined]
  const [id, name] = slug.split("-", 2)
  return [id, name]
}
