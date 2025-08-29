import { createEffect, createResource, createSignal } from "solid-js"
import TileEntitiesProvider from "./providers/TileEntitiesProvider"
import EntitySearch from "./search/EntitySearch"

const DATA_URL = import.meta.env.PUBLIC_DATA_URL

export default function GraphSearchBar(props: { graphId: string }) {
  const tileEntitiesProvider = new TileEntitiesProvider(DATA_URL)

  const [tileEntities] = createResource(() =>
    tileEntitiesProvider.getTileEntities(props.graphId)
  )

  const [entityIdToTileId] = createResource(tileEntities, (tiles) => {
    if (!tiles) return new Map<number, number>()
    const map = new Map<number, number>()
    tiles.forEach((tile) => {
      tile.entityIds.forEach((entityId) => {
        map.set(entityId, tile.tileId)
      })
    })
    return map
  })

  const [entityIds] = createResource(entityIdToTileId, (map) => {
    if (!map) return new Set<string>()
    return new Set<string>(map.keys().map((id) => `Q${id}`))
  })

  const entitySearch = new EntitySearch()

  const [searchValue, setSearchValue] = createSignal("")

  const [searchResults] = createResource(
    () => {
      const value = searchValue()
      const filter = entityIds()
      return value && filter ? [value, filter] : undefined
    },
    async (args) => {
      if (!args) return []
      const [value, filter] = args as [string, ReadonlySet<string>]
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

      {/* Temporary status message */}
      {entityIdToTileId.loading && (
        <div class="mt-2 text-gray-500 text-sm text-center">Loading...</div>
      )}
    </div>
  )
}
