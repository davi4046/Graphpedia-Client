import * as PIXIViewport from "pixi-viewport"
import * as PIXI from "pixi.js"
import EdgeView from "./EdgeView"
import NodeView from "./NodeView"

export interface GraphViewOptions {
  nodeStyle: {
    size: number
    color: PIXI.ColorSource
  }
  edgeStyle: {
    width: number
    color: PIXI.ColorSource
  }
}

export default class GraphView {
  private constructor(
    private app: PIXI.Application,
    private viewport: PIXIViewport.Viewport,
    private nodeContainer: PIXI.Container,
    private edgeContainer: PIXI.Container,
    private options: GraphViewOptions
  ) {}

  static async create(container: HTMLDivElement, options: GraphViewOptions) {
    const app = new PIXI.Application()

    // @ts-ignore
    globalThis.__PIXI_APP__ = app

    await app.init({
      background: "#1099bb",
      resizeTo: window,
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
    })

    viewport.drag().pinch().wheel().decelerate()
    app.stage.addChild(viewport)

    const edgeContainer = new PIXI.Container()
    const nodeContainer = new PIXI.Container()
    viewport.addChild(edgeContainer)
    viewport.addChild(nodeContainer)

    return new GraphView(app, viewport, nodeContainer, edgeContainer, options)
  }

  onViewportMoved(handler: () => void) {
    this.viewport.on("moved", handler)
  }

  onViewportZoomed(handler: () => void) {
    // Use "zoomed-end" instead of "zoomed" to ensure the handler is called
    // only after the zoom animation is fully complete and the viewport bounds
    // are stable. Using "zoomed" would trigger the handler multiple times
    // during the zoom animation, potentially with intermediate or inaccurate
    // bounds, which can cause issues like nodes temporarily disappearing
    // ("popping") due to transient empty search results. "zoomed-end" avoids
    // these problems by firing only once, with the final, correct bounds.
    this.viewport.on("zoomed-end", handler)
  }

  getVisibleBounds() {
    const { x, y, width, height } = this.viewport.getVisibleBounds()
    return {
      minX: x - this.options.nodeStyle.size,
      minY: y - this.options.nodeStyle.size,
      maxX: x + width,
      maxY: y + height,
    }
  }

  addNode(position: NodeCoords) {
    const size = this.options.nodeStyle.size
    const color = this.options.nodeStyle.color
    const opts = { ...position, size, color }
    return new NodeView(this.nodeContainer, opts)
  }

  addEdge(position1: NodeCoords, position2: NodeCoords) {
    const width = this.options.edgeStyle.width
    const color = this.options.edgeStyle.color
    const x1 = position1.x + this.options.nodeStyle.size / 2
    const y1 = position1.y + this.options.nodeStyle.size / 2
    const x2 = position2.x + this.options.nodeStyle.size / 2
    const y2 = position2.y + this.options.nodeStyle.size / 2
    const opts = { x1, y1, x2, y2, width, color }
    return new EdgeView(this.edgeContainer, opts)
  }

  destroy() {
    this.app.destroy(true, { children: true, texture: true })
  }
}

interface NodeCoords {
  readonly x: number
  readonly y: number
}
