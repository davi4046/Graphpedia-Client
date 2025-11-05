import { createResource } from "solid-js"
import { fetchGraphEntries } from "~/graph"

let cachedPromise: ReturnType<typeof fetchGraphEntries> | null = null

export default function useGraphList() {
  if (!cachedPromise) {
    cachedPromise = fetchGraphEntries()
  }
  const [result] = createResource(() => cachedPromise!)
  return result
}
