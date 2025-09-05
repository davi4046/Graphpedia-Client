import * as PIXIViewport from "pixi-viewport"
import * as PIXI from "pixi.js"
import EdgeView, { EdgeViewOptions } from "./EdgeView"
import NodeView, { NodeViewOptions } from "./NodeView"

export interface GraphViewOptions {
  background: PIXI.ColorSource
  nodeStyle: Omit<NodeViewOptions, "x" | "y">
  edgeStyle: Omit<EdgeViewOptions, "x1" | "y1" | "x2" | "y2">
  nodeEdgeMargin: number
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
      background: options.background,
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

  onViewportZoomedEnd(handler: () => void) {
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
    return new NodeView(this.nodeContainer, {
      ...position,
      ...this.options.nodeStyle,
    })
  }

  addEdge(position1: NodeCoords, position2: NodeCoords) {
    const size = this.options.nodeStyle.size
    const margin = this.options.nodeEdgeMargin

    const half = size / 2

    // Centers
    const c1 = { x: position1.x + half, y: position1.y + half }
    const c2 = { x: position2.x + half, y: position2.y + half }

    // Vector from c1 to c2
    const dx = c2.x - c1.x
    const dy = c2.y - c1.y

    // Scale for each node
    const scale1 = half / Math.max(Math.abs(dx), Math.abs(dy)) // from c1 to c2
    const scale2 = half / Math.max(Math.abs(dx), Math.abs(dy)) // from c2 to c1 (same magnitude, opposite direction)

    // Unit vector in direction of line
    const length = Math.sqrt(dx * dx + dy * dy)
    const ux = dx / length
    const uy = dy / length

    const x1 = c1.x + dx * scale1 + ux * margin
    const y1 = c1.y + dy * scale1 + uy * margin

    const x2 = c2.x - dx * scale2 - ux * margin
    const y2 = c2.y - dy * scale2 - uy * margin

    return new EdgeView(this.edgeContainer, {
      ...{ x1, y1, x2, y2 },
      ...this.options.edgeStyle,
    })
  }

  destroy() {
    this.app.destroy(true, { children: true, texture: true })
  }
}

interface NodeCoords {
  readonly x: number
  readonly y: number
}
