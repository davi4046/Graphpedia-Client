import GraphDataSource from "./dataSource"

export default class GraphNodeLocator {
  private constructor(
    private dataSource: GraphDataSource,
    private nodeTileMap: Map<number, number>
  ) {}

  static async create(dataSource: GraphDataSource) {
    const tilesEntities = await dataSource.fetchTilesEntities()
    const nodeTileMap = new Map<number, number>()
    for (const tile of tilesEntities) {
      for (const entityId of tile.entityIds) {
        nodeTileMap.set(entityId, tile.id)
      }
    }
    return new GraphNodeLocator(dataSource, nodeTileMap)
  }

  async locateNode(
    nodeId: number
  ): Promise<{ x: number; y: number } | undefined> {
    const tileId = this.nodeTileMap.get(nodeId)
    if (tileId === undefined) return undefined
    const tile = await this.dataSource.fetchTile(tileId)
    const node = tile.nodes.find((n) => n.id === nodeId)
    if (!node) return undefined
    return { x: node.x, y: node.y }
  }
}
