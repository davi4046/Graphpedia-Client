import * as PIXIViewport from "pixi-viewport"
import * as PIXI from "pixi.js"
import { onCleanup, onMount } from "solid-js"
import GraphViewController from "./controllers/GraphViewController"
import fetchTile from "./fetchers/fetchTile"
import fetchTileIndex from "./fetchers/fetchTileIndex"
import renderArrowHead from "./renderers/renderArrowHead"
import renderEdge from "./renderers/renderEdge"
import renderNode from "./renderers/renderNode"
import TileIndexService from "./services/TileIndexService"
import { Tile, TileEntry } from "./types"

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

    const arrowHeadGraphics = renderArrowHead()
    arrowHeadTexture = app.renderer.generateTexture(arrowHeadGraphics)

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
    const nodeHalfSize = NODE_SIZE / 2

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

    const drawNode = (x: number, y: number) => {
      const sprite = renderNode(x, y, NODE_SIZE)
      nodeContainer.addChild(sprite)
      return () => {
        nodeContainer.removeChild(sprite)
      }
    }

    const drawEdge = (x1: number, y1: number, x2: number, y2: number) => {
      x1 += nodeHalfSize
      y1 += nodeHalfSize
      x2 += nodeHalfSize
      y2 += nodeHalfSize
      const graphics = renderEdge(x1, y1, x2, y2, arrowHeadTexture)
      edgeContainer.addChild(graphics)
      return () => {
        edgeContainer.removeChild(graphics)
      }
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
