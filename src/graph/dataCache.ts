import { DBSchema, IDBPDatabase, openDB } from "idb"
import { GraphInfo, NodeInfo, TileInfo } from "./dataSource"

interface GraphDB extends DBSchema {
  graphInfo: {
    key: string
    value: GraphInfo
  }
  tileInfo: {
    key: string
    value: TileInfo
  }
  nodeInfo: {
    key: number
    value: NodeInfo
  }
}

export default class GraphDataCache {
  constructor(
    private graphId: string,
    private db: IDBPDatabase<GraphDB> | null = null
  ) {}

  static async create(graphId: string): Promise<GraphDataCache> {
    let db: IDBPDatabase<GraphDB> | null = null

    try {
      db = await openDB<GraphDB>(`graph-cache`, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains("graphInfo"))
            db.createObjectStore("graphInfo")
          if (!db.objectStoreNames.contains("tileInfo"))
            db.createObjectStore("tileInfo")
          if (!db.objectStoreNames.contains("nodeInfo"))
            db.createObjectStore("nodeInfo")
        },
      })
    } catch (error) {
      console.warn("Failed to open IndexedDB, caching disabled:", error)
    }

    return new GraphDataCache(graphId, db)
  }

  async getGraphInfo(): Promise<GraphInfo | undefined> {
    return this.db?.get("graphInfo", this.graphId)
  }

  async setGraphInfo(graphInfo: GraphInfo): Promise<void> {
    await this.db?.put("graphInfo", graphInfo, this.graphId)
  }

  async getTileInfo(tileId: number): Promise<TileInfo | undefined> {
    return this.db?.get("tileInfo", `${this.graphId}-${tileId}`)
  }

  async setTileInfo(tileId: number, tileInfo: TileInfo): Promise<void> {
    await this.db?.put("tileInfo", tileInfo, `${this.graphId}-${tileId}`)
  }

  async getNodeInfo(nodeId: number): Promise<NodeInfo | undefined> {
    return this.db?.get("nodeInfo", nodeId)
  }

  async setNodeInfo(nodeId: number, nodeInfo: NodeInfo): Promise<void> {
    await this.db?.put("nodeInfo", nodeInfo, nodeId)
  }
}
