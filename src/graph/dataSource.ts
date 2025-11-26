import {
  create as createBatcher,
  keyResolver,
  windowedFiniteBatchScheduler,
} from "@yornaath/batshit"
import { Item } from "wikibase-sdk"
import { DATA_URL } from "~/config"
import { BBox } from "~/types/geometry"
import {
  tileBBoxArrayParser,
  tileEntitiesArrayParser,
  tileParser,
} from "./dataParsers"
import { fetchItems } from "./wikidataAPI"

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
  private entities = createBatcher({
    fetcher: fetchItems,
    resolver: keyResolver("id"),
    scheduler: windowedFiniteBatchScheduler({
      windowMs: 500,
      maxBatchSize: 50,
    }),
  })

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

  async fetchInitialCenter(): Promise<{ x: number; y: number }> {
    const url = `${this.dataUrl}/graphs/${this.graphId}/client_initial_center.json?v=${this.graphVersion}`
    const response = await fetch(url)
    return response.json()
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
