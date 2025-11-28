import { createAsync } from "@solidjs/router"
import { Accessor } from "solid-js"
import { GraphDataSource, GraphNodeLocator } from "~/graph"

export default function useNodePosition(
  dataSource: Accessor<GraphDataSource | undefined>,
  itemId: string | undefined
) {
  const nodePosition = createAsync(async () => {
    const source = dataSource()
    if (!source) return
    if (!itemId) return
    const nodeId = Number(itemId.slice(1))
    const nodeLocator = await GraphNodeLocator.create(source)
    const position = await nodeLocator.locateNode(nodeId)
    return position
  })

  return nodePosition
}
