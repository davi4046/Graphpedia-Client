import { createAsync } from "@solidjs/router"
import { Accessor } from "solid-js"
import { GraphDataSource } from "~/graph"

export default function useInitialCenter(
  dataSource: Accessor<GraphDataSource | undefined>
) {
  const initialCenter = createAsync(async () => {
    const source = dataSource()
    if (!source) return undefined
    const center = await source.fetchInitialCenter()
    return center
  })

  return initialCenter
}
