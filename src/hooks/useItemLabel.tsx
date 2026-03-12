import { createAsync, query } from "@solidjs/router"
import { fetchItems } from "~/graph/wikidataAPI"

const getItemLabel = query(async (itemId: string) => {
  const items = await fetchItems([itemId])
  return items?.[0]?.labels?.en?.value
}, "itemLabel")

export default function useItemLabel(itemId: string | undefined) {
  const itemLabel = createAsync(
    async () => {
      if (!itemId) return undefined
      return getItemLabel(itemId)
    },
    { deferStream: true }
  )

  return itemLabel
}
