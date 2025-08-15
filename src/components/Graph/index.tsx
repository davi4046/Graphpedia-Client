import * as PIXIViewport from "pixi-viewport"
import * as PIXI from "pixi.js"
import { onCleanup, onMount } from "solid-js"
import GraphViewController from "./controllers/GraphViewController"
import fetchEntities from "./fetchers/fetchEntities"
import fetchTile from "./fetchers/fetchTile"
import fetchTileIndex from "./fetchers/fetchTileIndex"
import EdgeVisual from "./renderers/EdgeVisual"
import NodeVisual from "./renderers/NodeVisual"
import renderArrowHead from "./renderers/renderArrowHead"
import BatchProcessor from "./services/BatchProcessor"
import TileIndexService from "./services/TileIndexService"
import { GraphVisuals, Tile, TileEntry } from "./types"

type GraphProps = {
  graphId: string
}

const DATA_URL = import.meta.env.PUBLIC_DATA_URL
const NODE_SIZE = 10

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
    const entityFetcher = new BatchProcessor(fetchEntities)

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

    const arrowHeadGraphics = renderArrowHead()
    arrowHeadTexture = app.renderer.generateTexture(arrowHeadGraphics)

    const config: GraphVisuals = {
      nodeSize: NODE_SIZE,
      arrowHeadTexture: arrowHeadTexture,
    }

    const drawNode = (entityId: number, x: number, y: number) => {
      const dataPromise = entityFetcher.enqueue(entityId)
      const nodeVisual = new NodeVisual(x, y, dataPromise, config)
      nodeVisual.addToContainer(nodeContainer)
      return nodeVisual
    }

    const drawEdge = (x1: number, y1: number, x2: number, y2: number) => {
      const edgeVisual = new EdgeVisual(x1, y1, x2, y2, config)
      edgeVisual.addToContainer(edgeContainer)
      return edgeVisual
    }

    const graphViewCtrl = new GraphViewController(
      queryTiles,
      drawNode,
      drawEdge
    )

    const update = () => {
      const { x, y, width, height } = viewport.getVisibleBounds()
      graphViewCtrl.update(x - NODE_SIZE, y - NODE_SIZE, x + width, y + height)
    }

    viewport.on("moved", update)

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
