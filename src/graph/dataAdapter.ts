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
    return {
      nodes: tile.nodes.map(({ id, x, y }) => {
        return new NodeImpl(id, x, y, this.dataSource)
      }),
      edges: tile.edges.map(({ sourceId, targetId }) => {
        return new EdgeImpl(sourceId, targetId)
      }),
    }
  }
}

class NodeImpl implements GraphNode {
  id: string

  constructor(
    private _id: number,
    public x: number,
    public y: number,
    private dataSource: GraphDataSource
  ) {
    this.id = _id.toString()
  }

  private promise?: ReturnType<GraphDataSource["fetchItem"]>

  private async load() {
    if (!this.promise) {
      this.promise = this.dataSource.fetchItem(this._id)
    }
    return this.promise
  }

  async getDetails(): Promise<NodeDetails> {
    const item = await this.load()
    return {
      label: item.labels?.en?.value,
      description: item.descriptions?.en?.value,
      url: `${SITE_URL}/graph/${this.dataSource.graphId}?item=Q${this._id}`,
      wikidataId: `Q${this._id}`,
      wikidataUrl: `https://www.wikidata.org/wiki/Q${this._id}`,
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
    }
  }
}

class EdgeImpl implements GraphEdge {
  sourceId: string
  targetId: string

  constructor(sourceId: number, targetId: number) {
    this.sourceId = sourceId.toString()
    this.targetId = targetId.toString()
  }
}
