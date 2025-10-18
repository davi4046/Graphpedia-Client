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
  private _nodes?: GraphNode[]
  private _edges?: GraphEdge[]

  private async load(): Promise<TileInfo> {
    if (!this.promise) {
      this.promise = this.dataSource.fetchTileInfo(this.id)
    }
    return this.promise
  }

  async nodes(): Promise<GraphNode[]> {
    const tileInfo = await this.load()

    if (!this._nodes) {
      this._nodes = tileInfo.nodes.map((nodeData) => {
        return new NodeImpl(
          nodeData.id,
          nodeData.x,
          nodeData.y,
          this.dataSource
        )
      })
    }
    return this._nodes
  }

  async edges(): Promise<GraphEdge[]> {
    const tileInfo = await this.load()

    if (!this._edges) {
      this._edges = tileInfo.edges.map((edgeInfo) => {
        return new EdgeImpl(edgeInfo.sourceId, edgeInfo.targetId)
      })
    }
    return this._edges
  }
}

class NodeImpl implements GraphNode {
  constructor(
    public id: number,
    public x: number,
    public y: number,
    private dataSource: GraphDataSource
  ) {}

  private promise?: Promise<NodeInfo>

  private async load(): Promise<NodeInfo> {
    if (!this.promise) {
      this.promise = this.dataSource.fetchNodeInfo(this.id)
    }
    return this.promise
  }

  async label(): Promise<string> {
    const nodeInfo = await this.load()
    return nodeInfo.label
  }
}

class EdgeImpl implements GraphEdge {
  constructor(
    public sourceId: number,
    public targetId: number
  ) {}
}
