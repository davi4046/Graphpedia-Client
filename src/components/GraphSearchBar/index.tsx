import { createEffect, createResource, createSignal } from "solid-js"
import TileEntitiesProvider from "./providers/TileEntitiesProvider"

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

  createEffect(() => {
    if (!entityIdToTileId.loading && entityIdToTileId()) {
      console.log("EntityID → TileID map loaded:", entityIdToTileId())
    }
  })

  const [searchValue, setSearchValue] = createSignal("")

  const [searchResults] = createResource(searchValue, (query) => {
    if (!query) return []
    return ["foo", "bar", "baz"]
  })

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
