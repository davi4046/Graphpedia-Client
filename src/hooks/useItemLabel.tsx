import { createAsync, query } from "@solidjs/router"
import { fetchItems } from "~/graph/wikidataAPI"

const getItemLabel = query(async (itemId: string) => {
  try {
    const items = await fetchItems([itemId])
    return items?.[0]?.labels?.en?.value
  } catch (error) {
    console.error("Error fetching item label:", error)
  }
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
