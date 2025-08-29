import { createEffect, createResource, createSignal } from "solid-js"
import EntitySearch, { Filter } from "./search/EntitySearch"

export default function GraphSearchBar(props: { filter: Filter }) {
  const entitySearch = new EntitySearch()

  const [searchValue, setSearchValue] = createSignal("")

  const [searchResults] = createResource(
    () => {
      const value = searchValue()
      const filter = props.filter
      return value && filter ? [value, filter] : undefined
    },
    async (args) => {
      if (!args) return []
      const [value, filter] = args as [string, Filter]
      return await entitySearch.search(value, 10, filter)
    }
  )

  createEffect(() => {
    console.log("Search results for", searchValue(), ":", searchResults())
  })

  return (
    <div class="absolute top-4 left-1/2 transform -translate-x-1/2 w-1/3">
      <input
        type="text"
        value={searchValue()}
        onInput={(e) => setSearchValue(e.currentTarget.value)}
        placeholder="Search..."
        class="w-full p-2 rounded border border-gray-300 shadow"
      />
    </div>
  )
}
