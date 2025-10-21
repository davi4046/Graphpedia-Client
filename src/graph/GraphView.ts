import * as PIXIViewport from "pixi-viewport"
import { Application, Container, Texture } from "pixi.js"
import EdgeView from "./EdgeView"
import EllipticShadow from "./EllipticShadow"
import GraphQuery from "./GraphQuery"
import NodeView from "./NodeView"

export default class GraphView {
  private constructor(
    private app: Application,
    private viewport: PIXIViewport.Viewport,
    private nodeContainer: Container,
    private edgeContainer: Container,
    private nodeShadowTexture: Texture,
    private graphQuery: GraphQuery
  ) {}

  static async create(container: HTMLElement, graphQuery: GraphQuery) {
    const app = new Application()

    // @ts-ignore
    globalThis.__PIXI_APP__ = app

    await app.init({
      background: "white",
      resizeTo: container,
      preference: "webgpu",
      antialias: true,
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
      shadowTexture,
      graphQuery
    )
  }

  destroy() {
    this.app.destroy(true, { children: true, texture: true })
  }

  onViewportMoved(handler: () => void) {
    this.viewport.on("moved", handler)
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

  addNode(x: number, y: number, label: string) {
    return this.nodeContainer.addChild(
      new NodeView(x, y, label, this.nodeShadowTexture)
    )
  }

  addEdge(source: NodeView, target: NodeView) {
    return this.edgeContainer.addChild(new EdgeView(source, target))
  }

  getZoom() {
    return this.viewport.scale.x
  }

  setZoom(zoom: number) {
    this.viewport.setZoom(zoom, true)
    this.viewport.emit("moved", { viewport: this.viewport, type: "snap" })
  }

  resetViewport() {
    this.viewport.setZoom(1)
    this.viewport.moveCorner(0, 0)
    this.viewport.emit("moved", { viewport: this.viewport, type: "snap" })
  }
}
