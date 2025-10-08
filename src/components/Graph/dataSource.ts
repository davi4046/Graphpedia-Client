import {
  create as createBatcher,
  keyResolver,
  windowedFiniteBatchScheduler,
} from "@yornaath/batshit"
import WBK, { EntityId, Item } from "wikibase-sdk"
import { BBox } from "~/types/geometry"
import { tileBBoxArrayParser, tileParser } from "./dataParsers"

export interface GraphInfo {
  tiles: {
    id: number
    bbox: BBox
  }[]
}

export interface TileInfo {
  nodes: {
    id: number
    x: number
    y: number
  }[]
  edges: {
    sourceId: number
    targetId: number
  }[]
}

export interface NodeInfo {
  label: string
}

export interface GraphDataSource {
  fetchGraphInfo(): Promise<GraphInfo>
  fetchTileInfo(tileId: number): Promise<TileInfo>
  fetchNodeInfo(nodeId: number): Promise<NodeInfo>
}

export class GraphpediaDataSource implements GraphDataSource {
  constructor(
    private baseUrl: string,
    private graphId: string
  ) {}

  private entities = createBatcher({
    fetcher: fetchEntities,
    resolver: keyResolver("id"),
    scheduler: windowedFiniteBatchScheduler({
      windowMs: 500,
      maxBatchSize: 50,
    }),
  })

  async fetchGraphInfo(): Promise<GraphInfo> {
    const url = `${this.baseUrl}/graphs/${this.graphId}/tiles_bboxes.bin.gz`
    const response = await fetch(url)
    const data = await response.arrayBuffer()
    const tiles = tileBBoxArrayParser.parse(new Uint8Array(data))
    return { tiles }
  }

  async fetchTileInfo(tileId: number): Promise<TileInfo> {
    const url = `${this.baseUrl}/graphs/${this.graphId}/tiles/${tileId}.bin.gz`
    const response = await fetch(url)
    const data = await response.arrayBuffer()
    const tileData = tileParser.parse(new Uint8Array(data))
    return tileData
  }

  async fetchNodeInfo(nodeId: number): Promise<NodeInfo> {
    const item = await this.entities.fetch(`Q${nodeId}`)
    return { label: item.labels?.en?.value ?? `Q${nodeId}` }
  }
}

export async function fetchEntities(ids: string[]): Promise<Item[]> {
  const wbk = WBK({ instance: "https://www.wikidata.org" })
  const url = wbk.getEntities({
    ids: ids as EntityId[],
    props: ["labels"],
    languages: ["en"],
    format: "json",
  })
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`)
  }
  const json = await response.json()
  return Object.values(json.entities) as Item[]
}
