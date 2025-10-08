import camelcaseKeys from "camelcase-keys"
import { createResource } from "solid-js"
import { GRAPH_DATA_URL } from "~/config"

export type GraphEntry = {
  id: string
  label: string
  description: string
  aliases: string[]
  tags: string[]
  numNodes: number
  numEdges: number
}

async function fetchGraphsIndex(): Promise<GraphEntry[]> {
  const url = `${GRAPH_DATA_URL}/graphs_index.json.gz`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.statusText}`)
  }

  const raw = await response.json()
  const arr = camelcaseKeys(raw) as GraphEntry[]
  return arr
}

let cachedPromise: Promise<GraphEntry[]> | null = null

export function useGraphList() {
  if (!cachedPromise) {
    cachedPromise = fetchGraphsIndex()
  }
  const [result] = createResource(() => cachedPromise!)
  return result
}
