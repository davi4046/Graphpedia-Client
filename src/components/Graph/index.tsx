import { throttle } from "@solid-primitives/scheduled"
import * as PIXIViewport from "pixi-viewport"
import * as PIXI from "pixi.js"
import { onCleanup, onMount } from "solid-js"
import GraphDataManager from "./controllers/GraphDataManager"
import GraphRenderer from "./controllers/GraphRenderer"
import fetchEntities from "./fetchers/fetchEntities"
import fetchTile from "./fetchers/fetchTile"
import fetchTileIndex from "./fetchers/fetchTileIndex"
import EdgeVisual from "./renderers/EdgeVisual"
import NodeVisual from "./renderers/NodeVisual"
import renderArrowHead from "./renderers/renderArrowHead"
import BatchProcessor from "./services/BatchProcessor"
import TileIndexService from "./services/TileIndexService"
import {
  CancellablePromise,
  Entity,
  EntityResult,
  GraphStyle,
  Tile,
  TileEntry,
} from "./types"

type GraphProps = {
  graphId: string
}

const DATA_URL = import.meta.env.PUBLIC_DATA_URL
const NODE_SIZE = 10

class EntityProvider {
  private entityCache = new Map<number, Entity>()
  private batchProcessor: BatchProcessor<number, EntityResult>

  constructor() {
    this.batchProcessor = new BatchProcessor(async (ids: number[]) => {
      const entities = await fetchEntities(ids)
      entities.forEach((entity) => this.entityCache.set(entity.id, entity))
      return ids.map(
        (id) => this.entityCache.get(id) || { id, error: "Entity not found" }
      )
    })
  }

  get(id: number): CancellablePromise<EntityResult> {
    if (this.entityCache.has(id)) {
      return {
        promise: Promise.resolve(this.entityCache.get(id)!),
        cancel: () => {},
      }
    }
    return this.batchProcessor.enqueue(id)
  }

  process() {
    this.batchProcessor.process()
  }
}

export default function Graph(props: GraphProps) {
  let containerRef: HTMLDivElement | undefined
  let app: PIXI.Application
  let viewport: PIXIViewport.Viewport
  let arrowHeadTexture: PIXI.Texture

  onMount(async () => {
    app = new PIXI.Application()
    await app.init({
      background: "#1099bb",
      resizeTo: window,
      preference: "webgpu",
      antialias: false,
    })

    if (containerRef) {
      containerRef.appendChild(app.canvas)
    }

    viewport = new PIXIViewport.Viewport({
      screenWidth: app.screen.width,
      screenHeight: app.screen.height,
      worldWidth: 50000,
      worldHeight: 50000,
      events: app.renderer.events,
    })

    app.stage.addChild(viewport)

    viewport.drag().pinch().wheel().decelerate()

    const edgeContainer = new PIXI.Container()
    const nodeContainer = new PIXI.Container()
    viewport.addChild(edgeContainer)
    viewport.addChild(nodeContainer)

    const tileIndex = await fetchTileIndex(DATA_URL, props.graphId)
    const tileIndexSvc = new TileIndexService(tileIndex)

    const queryTiles = (
      minX: number,
      minY: number,
      maxX: number,
      maxY: number
    ): [TileEntry, Promise<Tile>][] => {
      const visibleTiles = tileIndexSvc.query(minX, minY, maxX, maxY)
      return visibleTiles.map((tileEntry) => [
        tileEntry,
        fetchTile(DATA_URL, props.graphId, tileEntry.tileId),
      ])
    }

    if (!arrowHeadTexture) {
      const arrowHeadGraphics = renderArrowHead()
      arrowHeadTexture = app.renderer.generateTexture(arrowHeadGraphics)
    }

    const graphStyle: GraphStyle = {
      nodeSize: NODE_SIZE,
      arrowHeadTexture: arrowHeadTexture,
    }

    const drawNode = NodeVisual.createFactory(nodeContainer, graphStyle)
    const drawEdge = EdgeVisual.createFactory(edgeContainer, graphStyle)

    const dataManager = new GraphDataManager(queryTiles)
    const entityProvider = new EntityProvider()
    const renderer = new GraphRenderer(
      dataManager,
      (id, x, y) => drawNode(x, y, entityProvider.get(id)),
      drawEdge
    )

    const fetchEntititesThrot = throttle(() => entityProvider.process(), 100)

    let minX: number, minY: number, maxX: number, maxY: number

    const update = () => {
      const { x, y, width, height } = viewport.getVisibleBounds()
      minX = x - NODE_SIZE
      minY = y - NODE_SIZE
      maxX = x + width
      maxY = y + height

      dataManager.load(minX, minY, maxX, maxY)
      renderer.render(minX, minY, maxX, maxY)
      fetchEntititesThrot()
    }

    viewport.on("moved", update)
    viewport.on("zoomed", update)

    update()
  })

  onCleanup(() => {
    app?.destroy(true, { children: true })
  })

  return (
    <div>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  )
}
