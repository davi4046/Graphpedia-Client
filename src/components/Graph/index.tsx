import * as PIXI from "pixi.js"
import * as PIXIViewport from "pixi-viewport"
import { onMount, onCleanup } from "solid-js"
import RBush from "rbush"
import { Edge, NodeBBox } from "./types"
import {
  fetchTile,
  fetchTileIndex,
  renderEdge,
  renderNode,
  TileIndexService,
} from "./utils"

type GraphProps = {
  graphId: string
}

export default function Graph(props: GraphProps) {
  let containerRef: HTMLDivElement | undefined
  let app: PIXI.Application
  let viewport: PIXIViewport.Viewport

  const DATA_URL = import.meta.env.PUBLIC_DATA_URL
  const NODE_SIZE = 10

  const fetchedTiles = new Set<number>()
  const nodeIndex = new RBush<NodeBBox>()
  const nodePosMap = new Map<number, [x: number, y: number]>()
  const nodeEdgesMap = new Map<number, Set<Edge>>()
  const drawnNodes = new Map<number, PIXI.Sprite>()
  const drawnEdges = new Map<Edge, PIXI.Graphics>()

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
    const nodeHalfSize = NODE_SIZE / 2

    viewport.on("moved", async () => {
      const { x, y, width, height } = viewport.getVisibleBounds()
      const visibleTiles = tileIndexSvc.query(x, y, x + width, y + height)

      for (const tileEntry of visibleTiles) {
        if (fetchedTiles.has(tileEntry.tileId)) continue
        fetchedTiles.add(tileEntry.tileId)

        fetchTile(DATA_URL, props.graphId, tileEntry.tileId).then(
          ({ nodes, edges }) => {
            for (const node of nodes) {
              nodePosMap.set(node.entityId, [node.x, node.y])

              const nodeBBox: NodeBBox = {
                minX: node.x,
                minY: node.y,
                maxX: node.x,
                maxY: node.y,
                entityId: node.entityId,
              }
              nodeIndex.insert(nodeBBox)
            }
            for (const edge of edges) {
              const source = edge.sourceId
              const target = edge.targetId

              if (!nodeEdgesMap.has(source)) {
                nodeEdgesMap.set(source, new Set())
              }
              nodeEdgesMap.get(source)!.add(edge)

              if (!nodeEdgesMap.has(target)) {
                nodeEdgesMap.set(target, new Set())
              }
              nodeEdgesMap.get(target)!.add(edge)
            }
          }
        )
      }

      const result = nodeIndex.search({
        minX: x,
        minY: y,
        maxX: x + width,
        maxY: y + height,
      })

      const visibleNodeIds = new Set<number>()

      for (const nodeBBox of result) {
        visibleNodeIds.add(nodeBBox.entityId)
        if (drawnNodes.has(nodeBBox.entityId)) continue

        const sprite = renderNode(nodeBBox.minX, nodeBBox.minY, NODE_SIZE)
        drawnNodes.set(nodeBBox.entityId, sprite)
        nodeContainer.addChild(sprite)

        const edges = nodeEdgesMap.get(nodeBBox.entityId)!
        for (const edge of edges) {
          if (drawnEdges.has(edge)) continue
          let x1, y1, x2, y2
          if (nodeBBox.entityId === edge.sourceId) {
            const targetPos = nodePosMap.get(edge.targetId)!
            x1 = nodeBBox.minX + nodeHalfSize
            y1 = nodeBBox.minY + nodeHalfSize
            x2 = targetPos[0] + nodeHalfSize
            y2 = targetPos[1] + nodeHalfSize
          } else {
            const sourcePos = nodePosMap.get(edge.sourceId)!
            x1 = sourcePos[0] + nodeHalfSize
            y1 = sourcePos[1] + nodeHalfSize
            x2 = nodeBBox.minX + nodeHalfSize
            y2 = nodeBBox.minY + nodeHalfSize
          }
          const edgeGraphics = renderEdge(x1, y1, x2, y2)
          drawnEdges.set(edge, edgeGraphics)
          edgeContainer.addChild(edgeGraphics)
        }
      }

      for (const [entityId, sprite] of drawnNodes) {
        if (visibleNodeIds.has(entityId)) continue
        drawnNodes.delete(entityId)
        nodeContainer.removeChild(sprite)

        const edges = nodeEdgesMap.get(entityId)!
        for (const edge of edges) {
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
