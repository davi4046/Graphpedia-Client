import { BBox } from "rbush"
import GraphDataSource, { GraphInfo, NodeInfo, TileInfo } from "./dataSource"
import { GraphEdge, GraphNode, GraphTile } from "./GraphEngine"

export default class GraphDataAdapter {
  constructor(private dataSource: GraphDataSource) {}

  private promise?: Promise<GraphInfo>
  private _tiles?: GraphTile[]

  private async load(): Promise<GraphInfo> {
    if (!this.promise) {
      this.promise = this.dataSource.fetchGraphInfo()
    }
    return this.promise
  }

  async tiles(): Promise<GraphTile[]> {
    const graphInfo = await this.load()

    if (!this._tiles) {
      this._tiles = graphInfo.tiles.map((tileInfo) => {
        return new TileImpl(tileInfo.id, tileInfo.bbox, this.dataSource)
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

  private promise?: Promise<TileInfo>

  private async load(): Promise<TileInfo> {
    if (!this.promise) {
      this.promise = this.dataSource.fetchTileInfo(this.id)
    }
    return this.promise
  }

  async getDetails(): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    const tileInfo = await this.load()
    return {
      nodes: tileInfo.nodes.map((nodeData) => {
        return new NodeImpl(
          nodeData.id,
          nodeData.x,
          nodeData.y,
          `https://www.graphpedia.org/graph/${this.dataSource.graphId}?item=Q${nodeData.id}`,
          `Q${nodeData.id}`,
          `https://www.wikidata.org/wiki/Q${nodeData.id}`,
          this.dataSource
        )
      }),
      edges: tileInfo.edges.map((edgeData) => {
        return new EdgeImpl(edgeData.sourceId, edgeData.targetId)
      }),
    }
  }
}

class NodeImpl implements GraphNode {
  constructor(
    public id: number,
    public x: number,
    public y: number,
    public url: string,
    public wikidataId: string,
    public wikidataUrl: string,
    private dataSource: GraphDataSource
  ) {}

  private promise?: Promise<NodeInfo>

  private async load(): Promise<NodeInfo> {
    if (!this.promise) {
      this.promise = this.dataSource.fetchNodeInfo(this.id)
    }
    return this.promise
  }

  async getDetails(): Promise<NodeInfo> {
    return this.load()
  }
}

class EdgeImpl implements GraphEdge {
  constructor(
    public sourceId: number,
    public targetId: number
  ) {}
}
