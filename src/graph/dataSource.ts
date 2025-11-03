import {
  create as createBatcher,
  keyResolver,
  windowedFiniteBatchScheduler,
} from "@yornaath/batshit"
import WBK, { EntityId, Item } from "wikibase-sdk"
import { BBox } from "~/types/geometry"
import { tileBBoxArrayParser, tileParser } from "./dataParsers"

export type TilesBBoxes = {
  id: number
  bbox: BBox
}[]

export type Tile = {
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

export default class GraphDataSource {
  private constructor(
    private baseUrl: string,
    readonly graphId: string,
    private graphVersion: string
  ) {}

  static async create(baseUrl: string, graphId: string) {
    const url = `${baseUrl}/graphs/${graphId}/version.txt`
    const response = await fetch(url)
    const version = await response.text()
    return new GraphDataSource(baseUrl, graphId, version.trim())
  }

  private entities = createBatcher({
    fetcher: fetchEntities,
    resolver: keyResolver("id"),
    scheduler: windowedFiniteBatchScheduler({
      windowMs: 500,
      maxBatchSize: 50,
    }),
  })

  async fetchTilesBBoxes(): Promise<TilesBBoxes> {
    const url = `${this.baseUrl}/graphs/${this.graphId}/tiles_bboxes.bin.gz?v=${this.graphVersion}`
    const response = await fetch(url)
    const data = await response.arrayBuffer()
    return tileBBoxArrayParser.parse(new Uint8Array(data))
  }

  async fetchTile(tileId: number): Promise<Tile> {
    const url = `${this.baseUrl}/graphs/${this.graphId}/tiles/${tileId}.bin.gz?v=${this.graphVersion}`
    const response = await fetch(url)
    const data = await response.arrayBuffer()
    return tileParser.parse(new Uint8Array(data))
  }

  async fetchItem(itemId: number): Promise<Item> {
    return this.entities.fetch(`Q${itemId}`)
  }
}

async function fetchEntities(ids: string[]): Promise<Item[]> {
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
