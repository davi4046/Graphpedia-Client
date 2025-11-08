import { createResource } from "solid-js"
import { fetchGraphsIndex } from "~/graph"

let cachedPromise: ReturnType<typeof fetchGraphsIndex> | null = null

export default function useGraphList() {
  if (!cachedPromise) {
    cachedPromise = fetchGraphsIndex()
  }
  const [result] = createResource(() => cachedPromise!)
  return result
}
