import * as PIXIViewport from "pixi-viewport"
import { Application, Container, EventEmitter, Texture } from "pixi.js"
import EdgeView from "./EdgeView"
import EllipticShadow from "./EllipticShadow"
import { NodeDetails } from "./GraphEngine"
import NodeView from "./NodeView"

type GraphViewEvents = {
  viewportMoved: () => void
}

export default class GraphView extends EventEmitter<GraphViewEvents> {
  private static readonly DEFAULT_ZOOM = 2.5

  private constructor(
    private app: Application,
    private viewport: PIXIViewport.Viewport,
    private nodeContainer: Container,
    private edgeContainer: Container,
    private nodeShadowTexture: Texture
  ) {
    super()

    this.viewport.on("moved", () => this.emit("viewportMoved"))

    this.app.renderer.on("resize", () => {
      const width = this.app.renderer.width
      const height = this.app.renderer.height
      this.viewport.resize(width, height)
      this.emit("viewportMoved")
    })
  }

  static async create(container: HTMLElement) {
    const app = new Application()

    // @ts-ignore
    globalThis.__PIXI_APP__ = app

    const dpr = window.devicePixelRatio || 1
    const resolution = dpr === 1 ? 2.5 : dpr

    await app.init({
      background: "white",
      resizeTo: container,
      preference: "webgpu",
      antialias: true,
      resolution: resolution,
      autoDensity: true,
    })

    container.appendChild(app.canvas)

    const viewport = new PIXIViewport.Viewport({
      screenWidth: app.screen.width,
      screenHeight: app.screen.height,
      worldWidth: 50000,
      worldHeight: 50000,
      events: app.renderer.events,
      passiveWheel: false,
      allowPreserveDragOutside: true,
    })

    viewport.drag().pinch().wheel().decelerate()
    viewport.setZoom(GraphView.DEFAULT_ZOOM)
    viewport.clampZoom({
      minScale: GraphView.DEFAULT_ZOOM * 0.25,
      maxScale: GraphView.DEFAULT_ZOOM * 4,
    })

    app.stage.addChild(viewport)

    const edgeContainer = new Container()
    const nodeContainer = new Container()
    viewport.addChild(edgeContainer)
    viewport.addChild(nodeContainer)

    const shadowTexture = new EllipticShadow({
      radiusX: 96,
      radiusY: 32,
      color: 0x000000,
      alpha: 0.5,
      blurStrength: 12,
      blurQuality: 5,
    }).renderTexture(app.renderer)

    return new GraphView(
      app,
      viewport,
      nodeContainer,
      edgeContainer,
      shadowTexture
    )
  }

  destroy() {
    this.app.destroy(true, { children: true, texture: true })
  }

  getVisibleBounds() {
    const { x, y, width, height } = this.viewport.getVisibleBounds()
    return {
      minX: x,
      minY: y,
      maxX: x + width,
      maxY: y + height,
    }
  }

  addNode(positionX: number, positionY: number, details: NodeDetails) {
    const node = new NodeView(
      positionX,
      positionY,
      details,
      this.nodeShadowTexture
    )
    this.nodeContainer.addChild(node)
    return node
  }

  addEdge(source: NodeView, target: NodeView) {
    const edge = new EdgeView(source, target)
    this.edgeContainer.addChild(edge)
    return edge
  }

  getZoom() {
    return this.viewport.scale.x / GraphView.DEFAULT_ZOOM
  }

  setZoom(zoom: number) {
    this.viewport.setZoom(GraphView.DEFAULT_ZOOM * zoom, true)
    this.emit("viewportMoved")
  }

  getViewportCorner(): { x: number; y: number; zoom: number } {
    const { x, y } = this.viewport.corner
    const zoom = this.getZoom()
    return { x, y, zoom }
  }

  setViewportCorner(x: number, y: number, zoom?: number) {
    if (zoom !== undefined) {
      this.viewport.setZoom(GraphView.DEFAULT_ZOOM * zoom)
    }
    this.viewport.moveCorner(x, y)
    this.emit("viewportMoved")
  }

  getViewportCenter(): { x: number; y: number; zoom: number } {
    const { x, y } = this.viewport.center
    const zoom = this.getZoom()
    return { x, y, zoom }
  }

  setViewportCenter(x: number, y: number, zoom?: number) {
    if (zoom != undefined) {
      this.viewport.setZoom(GraphView.DEFAULT_ZOOM * zoom)
    }
    this.viewport.moveCenter(x, y)
    this.emit("viewportMoved")
  }
}
