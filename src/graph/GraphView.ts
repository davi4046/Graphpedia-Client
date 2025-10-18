import * as PIXIViewport from "pixi-viewport"
import * as PIXI from "pixi.js"
import EdgeView from "./EdgeView"
import NodeView from "./NodeView"

export default class GraphView {
  private constructor(
    private app: PIXI.Application,
    private viewport: PIXIViewport.Viewport,
    private nodeContainer: PIXI.Container,
    private edgeContainer: PIXI.Container
  ) {}

  static async create(container: HTMLElement) {
    const app = new PIXI.Application()

    // @ts-ignore
    globalThis.__PIXI_APP__ = app

    await app.init({
      background: "white",
      resizeTo: container,
      preference: "webgpu",
      antialias: false,
    })

    container.appendChild(app.canvas)

    const viewport = new PIXIViewport.Viewport({
      screenWidth: app.screen.width,
      screenHeight: app.screen.height,
      worldWidth: 50000,
      worldHeight: 50000,
      events: app.renderer.events,
      passiveWheel: false,
    })

    viewport.drag().pinch().wheel().decelerate()
    app.stage.addChild(viewport)

    const edgeContainer = new PIXI.Container()
    const nodeContainer = new PIXI.Container()
    viewport.addChild(edgeContainer)
    viewport.addChild(nodeContainer)

    NodeView.initShadowTexture(app.renderer)

    return new GraphView(app, viewport, nodeContainer, edgeContainer)
  }

  destroy() {
    this.app.destroy(true, { children: true, texture: true })
  }

  onViewportMoved(handler: () => void) {
    this.viewport.on("moved", handler)
  }

  offViewportMoved(handler: () => void) {
    this.viewport.off("moved", handler)
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

  addNode(labelText: string, positionX: number, positionY: number) {
    return new NodeView(this.nodeContainer, labelText, positionX, positionY)
  }

  addEdge(source: NodeView, target: NodeView) {
    return new EdgeView(this.edgeContainer, source, target)
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
