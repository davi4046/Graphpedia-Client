import { createSignal, onMount } from "solid-js"
import { GraphDataSource } from "~/graph"

export default function useDataSource(graphId: string) {
  const [dataSource, setDataSource] = createSignal<GraphDataSource>()

  onMount(async () => {
    const ds = await GraphDataSource.create(graphId)
    setDataSource(ds)
  })

  return dataSource
}
