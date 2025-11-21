import {
  create as createBatcher,
  keyResolver,
  windowedFiniteBatchScheduler,
} from "@yornaath/batshit"
import WBK, { EntityId, Item } from "wikibase-sdk"
import { DATA_URL, USER_AGENT } from "~/config"
import { BBox } from "~/types/geometry"
import {
  tileBBoxArrayParser,
  tileEntitiesArrayParser,
  tileParser,
} from "./dataParsers"

export type TilesBBoxes = {
  id: number
  bbox: BBox
}[]

export type TilesEntities = {
  id: number
  entityIds: number[]
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
    private dataUrl: string,
    readonly graphId: string,
    readonly graphVersion: string
  ) {}

  static async create(graphId: string, dataUrl = DATA_URL) {
    const url = `${dataUrl}/graphs/${graphId}/version.txt`
    const response = await fetch(url)
    const version = await response.text()
    return new GraphDataSource(dataUrl, graphId, version.trim())
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
    const url = `${this.dataUrl}/graphs/${this.graphId}/tiles_bboxes.bin.gz?v=${this.graphVersion}`
    const response = await fetch(url)
    const data = await response.arrayBuffer()
    return tileBBoxArrayParser.parse(new Uint8Array(data))
  }

  async fetchTilesEntities(): Promise<TilesEntities> {
    const url = `${this.dataUrl}/graphs/${this.graphId}/tiles_entities.bin.gz?v=${this.graphVersion}`
    const response = await fetch(url)
    const data = await response.arrayBuffer()
    return tileEntitiesArrayParser.parse(new Uint8Array(data))
  }

  async fetchTile(tileId: number): Promise<Tile> {
    const url = `${this.dataUrl}/graphs/${this.graphId}/tiles/${tileId}.bin.gz?v=${this.graphVersion}`
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
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
    },
  })
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`)
  }
  const json = await response.json()
  return Object.values(json.entities) as Item[]
}
