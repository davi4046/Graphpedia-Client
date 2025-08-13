import * as PIXI from "pixi.js"
import * as PIXIViewport from "pixi-viewport"
import { onMount, onCleanup } from "solid-js"
import RBush from "rbush"
import { NodeBBox, Tile } from "./types"
import {
  fetchTile,
  fetchTileIndex,
  renderArrowHead,
  renderEdge,
  renderNode,
  TileIndexService,
  unpackEdge,
  PackedEdge,
  loadTile,
} from "./utils"

type GraphProps = {
  graphId: string
}

export default function Graph(props: GraphProps) {
  let containerRef: HTMLDivElement | undefined
  let app: PIXI.Application
  let viewport: PIXIViewport.Viewport
  let arrowHeadTexture: PIXI.Texture

  const DATA_URL = import.meta.env.PUBLIC_DATA_URL
  const NODE_SIZE = 10

  const fetchedTiles = new Set<number>()
  const nodeIndex = new RBush<NodeBBox>()
  const nodePosMap = new Map<number, [x: number, y: number]>()
  const nodeEdgesMap = new Map<number, Set<PackedEdge>>()
  const drawnNodes = new Map<number, PIXI.Sprite>()
  const drawnEdges = new Map<PackedEdge, PIXI.Graphics>()

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

    viewport.on("moved", async () => {
      const { x, y, width, height } = viewport.getVisibleBounds()
      const visibleTiles = tileIndexSvc.query(x, y, x + width, y + height)

      for (const tileEntry of visibleTiles) {
        if (fetchedTiles.has(tileEntry.tileId)) continue
        fetchedTiles.add(tileEntry.tileId)

        fetchTile(DATA_URL, props.graphId, tileEntry.tileId).then((tile) =>
          loadTile(nodePosMap, nodeEdgesMap, nodeIndex, tile)
        )
      }

      const result = nodeIndex.search({
        minX: x,
        minY: y,
        maxX: x + width,
        maxY: y + height,
      })

      const visibleNodeIds = new Set<number>()

      for (const { entityId, minX: nodeX, minY: nodeY } of result) {
        visibleNodeIds.add(entityId)
        if (drawnNodes.has(entityId)) continue

        const sprite = renderNode(nodeX, nodeY, NODE_SIZE)
        drawnNodes.set(entityId, sprite)
        nodeContainer.addChild(sprite)

        const edges = nodeEdgesMap.get(entityId)!
        for (const edge of edges) {
          if (drawnEdges.has(edge)) continue

          const [sourceId, targetId] = unpackEdge(edge)

          let x1, y1, x2, y2
          if (entityId === sourceId) {
            const targetPos = nodePosMap.get(targetId)!
            x1 = nodeX + nodeHalfSize
            y1 = nodeY + nodeHalfSize
            x2 = targetPos[0] + nodeHalfSize
            y2 = targetPos[1] + nodeHalfSize
          } else {
            const sourcePos = nodePosMap.get(sourceId)!
            x1 = sourcePos[0] + nodeHalfSize
            y1 = sourcePos[1] + nodeHalfSize
            x2 = nodeX + nodeHalfSize
            y2 = nodeY + nodeHalfSize
          }

          const edgeGraphics = renderEdge(x1, y1, x2, y2)
          drawnEdges.set(edge, edgeGraphics)
          edgeContainer.addChild(edgeGraphics)

          const dx = x2 - x1
          const dy = y2 - y1
          const angle = Math.atan2(dy, dx)

          const arrowHeadSprite = new PIXI.Sprite(arrowHeadTexture)
          arrowHeadSprite.scale.set(0.2)
          arrowHeadSprite.anchor.set(1, 0.5)
          arrowHeadSprite.x = x2
          arrowHeadSprite.y = y2
          arrowHeadSprite.rotation = angle
          edgeGraphics.addChild(arrowHeadSprite)
        }
      }

      for (const [entityId, sprite] of drawnNodes) {
        if (visibleNodeIds.has(entityId)) continue

        drawnNodes.delete(entityId)
        nodeContainer.removeChild(sprite)

        const edges = nodeEdgesMap.get(entityId)!
        for (const edge of edges) {
          const [sourceId, targetId] = unpackEdge(edge)
          const otherId = sourceId === entityId ? targetId : sourceId
          if (drawnNodes.has(otherId)) continue

          const edgeGraphics = drawnEdges.get(edge)!
          drawnEdges.delete(edge)
          edgeContainer.removeChild(edgeGraphics)
        }
      }
    })
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
