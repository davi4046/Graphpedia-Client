import TileEntitiesProvider from "./providers/TileEntitiesProvider"

const DATA_URL = import.meta.env.PUBLIC_DATA_URL

export default function GraphSearchBar(props: { graphId: string }) {
  const tileEntitiesProvider = new TileEntitiesProvider(DATA_URL)
  const tileEntities = tileEntitiesProvider.getTileEntities(props.graphId)

  return (
    <div class="absolute top-4 left-1/2 transform -translate-x-1/2 w-1/3">
      <input
        type="text"
        placeholder="Search..."
        class="w-full p-2 rounded border border-gray-300 shadow"
      />
    </div>
  )
}
