import camelcaseKeys from "camelcase-keys"
import { gunzipSync } from "fflate"
import { createResource } from "solid-js"
import { DATA_URL } from "~/config"

export type GraphsIndexEntry = {
  id: string
  label: string
  description: string
  aliases: string[]
  tags: string[]
  numNodes: number
  numEdges: number
}

export type GraphsIndex = GraphsIndexEntry[]

let cachedPromise: Promise<GraphsIndex>

async function fetchGraphsIndex(): Promise<GraphsIndex> {
  if (!cachedPromise) {
    cachedPromise = (async () => {
      const res = await fetch(`${DATA_URL}/graphs_index.json.gz`)
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`)

      const compressed = new Uint8Array(await res.arrayBuffer())
      const decompressed = gunzipSync(compressed)

      const raw = JSON.parse(new TextDecoder().decode(decompressed))
      return camelcaseKeys(raw, { deep: true }) as GraphsIndex
    })()
  }
  return cachedPromise
}

export function useGraphsIndex() {
  const [graphsIndex] = createResource(fetchGraphsIndex)
  return graphsIndex
}
