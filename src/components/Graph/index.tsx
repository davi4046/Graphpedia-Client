import { throttle } from "@solid-primitives/scheduled"
import * as PIXIViewport from "pixi-viewport"
import * as PIXI from "pixi.js"
import { onCleanup, onMount } from "solid-js"
import NodeEdgesMap from "./maps/NodeEdgesMap"
import NodePositionMap from "./maps/NodePositionMap"
import EntityProvider from "./providers/EntityProvider"
import TileBBoxesProvider from "./providers/TileBBoxesProvider"
import TileProvider from "./providers/TileProvider"
import { EncodedEdge, encodeEdge } from "./shared/edge-codec"
import NodeSpatialIndex from "./spatial/NodeSpatialIndex"
import TileSpatialIndex from "./spatial/TileSpatialIndex"
import { Edge, GraphStyle, Node, Tile } from "./types"
import EdgeVisual from "./visuals/EdgeVisual"
import NodeVisual from "./visuals/NodeVisual"

const DATA_URL = import.meta.env.PUBLIC_DATA_URL

const GRAPH_CONFIG = {
  background: "#1099bb",
  nodeSize: 10,
  viewport: {
    worldWidth: 50000,
    worldHeight: 50000,
  },
  edgeHead: {
    width: 40,
    height: 40,
    color: 0xff0000,
  },
} as const

function createViewport(app: PIXI.Application): PIXIViewport.Viewport {
  const viewport = new PIXIViewport.Viewport({
    screenWidth: app.screen.width,
    screenHeight: app.screen.height,
    worldWidth: GRAPH_CONFIG.viewport.worldWidth,
    worldHeight: GRAPH_CONFIG.viewport.worldHeight,
    events: app.renderer.events,
  })

  viewport.drag().pinch().wheel().decelerate()
  return viewport
}

function createEdgeHeadTexture(renderer: PIXI.Renderer): PIXI.Texture {
  const triangle = new PIXI.Graphics()
  triangle.moveTo(0, 0)
  triangle.lineTo(GRAPH_CONFIG.edgeHead.width, GRAPH_CONFIG.edgeHead.height / 2)
  triangle.lineTo(0, GRAPH_CONFIG.edgeHead.height)
  triangle.closePath()
  triangle.fill({ color: GRAPH_CONFIG.edgeHead.color })

  return renderer.generateTexture(triangle)
}

export default function Graph(props: { graphId: string }) {
  let containerRef: HTMLDivElement | undefined
  let app: PIXI.Application

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

    const viewport = createViewport(app)
    app.stage.addChild(viewport)

    const edgeContainer = new PIXI.Container()
    const nodeContainer = new PIXI.Container()
    viewport.addChild(edgeContainer)
    viewport.addChild(nodeContainer)

    const nodePositionMap = new NodePositionMap()
    const nodeEdgesMap = new NodeEdgesMap()
    const nodeSpatialIndex = new NodeSpatialIndex()
    const loadTile = (tile: Tile) => {
      for (const node of tile.nodes) {
        nodePositionMap.setPosition(node)
        nodeSpatialIndex.insert(node)
      }
      for (const edge of tile.edges) {
        nodeEdgesMap.addEdge(edge)
      }
    }

    const tileIndexProvider = new TileBBoxesProvider(DATA_URL)
    const tileProvider = new TileProvider(DATA_URL)
    const entityProvider = new EntityProvider()

    const tileBBoxes = await tileIndexProvider.getTileIndex(props.graphId)
    const tileSpatialIndex = new TileSpatialIndex(tileBBoxes)

    const edgeHeadTexture = createEdgeHeadTexture(app.renderer)
    const graphStyle: GraphStyle = {
      nodeSize: GRAPH_CONFIG.nodeSize,
      edgeHeadTexture: edgeHeadTexture,
    }

    const drawNode = (node: Node): NodeVisual => {
      const request = entityProvider.requestEntity(node.entityId)
      return new NodeVisual(node.x, node.y, request, nodeContainer, graphStyle)
    }
    const drawEdge = (edge: Edge): EdgeVisual => {
      const [x1, y1] = nodePositionMap.getPosition(edge.sourceId)!
      const [x2, y2] = nodePositionMap.getPosition(edge.targetId)!
      return new EdgeVisual(x1, y1, x2, y2, edgeContainer, graphStyle)
    }

    const loadedTiles = new Set<number>()
    const drawnNodes = new Map<number, NodeVisual>()
    const drawnEdges = new Map<EncodedEdge, EdgeVisual>()

    const resolveEntities = throttle(
      () => entityProvider.resolveRequests(),
      100
    )

    const update = () => {
      const { x, y, width, height } = viewport.getVisibleBounds()
      const minX = x - GRAPH_CONFIG.nodeSize
      const minY = y - GRAPH_CONFIG.nodeSize
      const maxX = x + width
      const maxY = y + height

      const tileIds = tileSpatialIndex
        .search(minX, minY, maxX, maxY)
        .map((tileEntry) => tileEntry.tileId)
        .filter((tileId) => !loadedTiles.has(tileId))

      for (const tileId of tileIds) {
        loadedTiles.add(tileId)
        tileProvider.getTile(props.graphId, tileId).then(loadTile).then(update)
      }

      const nodes = nodeSpatialIndex.search(minX, minY, maxX, maxY)
      const entityIds = new Set()

      for (const node of nodes) {
        entityIds.add(node.entityId)

        if (!drawnNodes.has(node.entityId)) {
          const nodeVisual = drawNode(node)
          drawnNodes.set(node.entityId, nodeVisual)
        }

        const edges = nodeEdgesMap.getEdges(node.entityId) || []
        for (const edge of edges) {
          const encodedEdge = encodeEdge(edge)
          if (drawnEdges.has(encodedEdge)) continue
          const edgeHandle = drawEdge(edge)
          drawnEdges.set(encodedEdge, edgeHandle)
        }
      }

      for (const [entityId, nodeVisual] of drawnNodes) {
        if (entityIds.has(entityId)) continue
        nodeVisual.remove()
        drawnNodes.delete(entityId)

        const edges = nodeEdgesMap.getEdges(entityId) ?? []
        for (const edge of edges) {
          if (drawnNodes.has(edge.sourceId) || drawnNodes.has(edge.targetId)) {
            continue
          }
          const encodedEdge = encodeEdge(edge)
          const edgeHandle = drawnEdges.get(encodedEdge)
          edgeHandle?.remove()
          drawnEdges.delete(encodedEdge)
        }
      }

      resolveEntities()
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
