import {
  create as createBatcher,
  keyResolver,
  windowedFiniteBatchScheduler,
} from "@yornaath/batshit"
import WBK, { EntityId, Item } from "wikibase-sdk"
import { BBox } from "~/types/geometry"
import GraphDataCache from "./dataCache"
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

export type Sitelinks = Record<
  | "wikipedia"
  | "wikibooks"
  | "wikinews"
  | "wikiquote"
  | "wikisource"
  | "wikiversity"
  | "wikivoyage"
  | "wiktionary"
  | "commons",
  string | undefined
>

export interface NodeInfo {
  label?: string
  description?: string
  sitelinks: Sitelinks
}

export default class GraphDataSource {
  constructor(
    private baseUrl: string,
    readonly graphId: string,
    private dataCache: GraphDataCache
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
    const cached = await this.dataCache.getGraphInfo()
    if (cached) return cached
    const url = `${this.baseUrl}/graphs/${this.graphId}/tiles_bboxes.bin.gz`
    const response = await fetch(url)
    const data = await response.arrayBuffer()
    const tiles = tileBBoxArrayParser.parse(new Uint8Array(data))
    await this.dataCache.setGraphInfo({ tiles })
    return { tiles }
  }

  async fetchTileInfo(tileId: number): Promise<TileInfo> {
    const cached = await this.dataCache.getTileInfo(tileId)
    if (cached) return cached
    const url = `${this.baseUrl}/graphs/${this.graphId}/tiles/${tileId}.bin.gz`
    const response = await fetch(url)
    const data = await response.arrayBuffer()
    const tileData = tileParser.parse(new Uint8Array(data))
    await this.dataCache.setTileInfo(tileId, tileData)
    return tileData
  }

  async fetchNodeInfo(nodeId: number): Promise<NodeInfo> {
    const cached = await this.dataCache.getNodeInfo(nodeId)
    if (cached) return cached
    const item = await this.entities.fetch(`Q${nodeId}`)
    const result: NodeInfo = {
      label: item.labels?.en?.value,
      description: item.descriptions?.en?.value,
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
    await this.dataCache.setNodeInfo(nodeId, result)
    return result
  }
}

export async function fetchEntities(ids: string[]): Promise<Item[]> {
  const wbk = WBK({ instance: "https://www.wikidata.org" })
  const url = wbk.getEntities({
    ids: ids as EntityId[],
    props: ["labels", "descriptions", "sitelinks/urls"],
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
