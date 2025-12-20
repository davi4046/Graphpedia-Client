import { BBox } from "rbush"
import { SITE_URL } from "~/config"
import GraphDataSource, { TilesBBoxes } from "./dataSource"
import {
  GraphEdge,
  GraphNode,
  GraphTile,
  NodeDetails,
  TileContent,
} from "./GraphEngine"

export default class GraphDataAdapter {
  constructor(private dataSource: GraphDataSource) {}

  private promise?: ReturnType<GraphDataSource["fetchTilesBBoxes"]>
  private _tiles?: GraphTile[]

  private async load(): Promise<TilesBBoxes> {
    if (!this.promise) {
      this.promise = this.dataSource.fetchTilesBBoxes()
    }
    return this.promise
  }

  async tiles(): Promise<GraphTile[]> {
    const tileBBoxes = await this.load()

    if (!this._tiles) {
      this._tiles = tileBBoxes.map(({ id, bbox }) => {
        return new TileImpl(id, bbox, this.dataSource)
      })
    }
    return this._tiles
  }
}

class TileImpl implements GraphTile {
  constructor(
    public id: number,
    public bbox: BBox,
    private dataSource: GraphDataSource
  ) {}

  private promise?: ReturnType<GraphDataSource["fetchTile"]>

  private async load() {
    if (!this.promise) {
      this.promise = this.dataSource.fetchTile(this.id)
    }
    return this.promise
  }

  async getContent(): Promise<TileContent> {
    const tile = await this.load()

    const nodes: GraphNode[] = []
    const nodeIds = new Set<number>()

    let nodeId = NaN
    let nodeX = NaN
    let nodeY = NaN
    let itemIds: number[] = []

    for (const { x, y, id } of tile.nodes) {
      if (x !== nodeX || y !== nodeY) {
        if (itemIds.length > 0) {
          nodes.push(
            new NodeImpl(nodeId, nodeX, nodeY, itemIds, this.dataSource)
          )
        }

        nodeId = id
        nodeX = x
        nodeY = y
        itemIds = []

        nodeIds.add(id)
      }

      itemIds.push(id)
    }

    if (itemIds.length > 0) {
      nodes.push(new NodeImpl(nodeId, nodeX, nodeY, itemIds, this.dataSource))
    }

    const edges = tile.edges.flatMap(({ sourceId, targetId }) => {
      if (!nodeIds.has(sourceId) || !nodeIds.has(targetId)) return []
      return new EdgeImpl(sourceId, targetId)
    })

    return { nodes, edges }
  }
}

class NodeImpl implements GraphNode {
  constructor(
    public id: number,
    public x: number,
    public y: number,
    private itemIds: number[],
    private dataSource: GraphDataSource
  ) {}

  private promises?: ReturnType<GraphDataSource["fetchItem"]>[]

  private async load() {
    if (!this.promises) {
      this.promises = this.itemIds.map((id) => this.dataSource.fetchItem(id))
    }
    return Promise.all(this.promises)
  }

  async getDetails(): Promise<NodeDetails[]> {
    const items = await this.load()
    return items.map((item) => ({
      label: item.labels?.en?.value,
      description: item.descriptions?.en?.value,
      url: `${SITE_URL}/graph/${this.dataSource.graphId}?item=${item.id}`,
      wikidataId: item.id,
      wikidataUrl: `https://www.wikidata.org/wiki/${item.id}`,
      sitelinks: {
        wikipedia: item.sitelinks?.enwiki?.url,
        wikibooks: item.sitelinks?.enwikibooks?.url,
        wikinews: item.sitelinks?.enwikinews?.url,
        wikiquote: item.sitelinks?.enwikiquote?.url,
        wikisource: item.sitelinks?.enwikisource?.url,
        wikiversity: item.sitelinks?.enwikiversity?.url,
        wikivoyage: item.sitelinks?.enwikivoyage?.url,
        wiktionary: item.sitelinks?.enwiktionary?.url,
        commons: item.sitelinks?.commonswiki?.url,
      },
    }))
  }
}

class EdgeImpl implements GraphEdge {
  constructor(
    public sourceId: number,
    public targetId: number
  ) {}
}
