import * as PIXIViewport from "pixi-viewport"
import * as PIXI from "pixi.js"
import EdgeView, { EdgeViewOptions } from "./EdgeView"
import NodeView, { NodeViewOptions } from "./NodeView"

export interface GraphViewOptions {
  background: PIXI.ColorSource
  nodeStyle: Omit<NodeViewOptions, "x" | "y">
  edgeStyle: Omit<EdgeViewOptions, "x1" | "y1" | "x2" | "y2">
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
    const half = size / 2

    const c1 = { x: position1.x + half, y: position1.y + half }
    const c2 = { x: position2.x + half, y: position2.y + half }

    const { x: x1, y: y1 } = c1
    const { x: x2, y: y2 } = intersectLineWithSquareBorder(c2, c1, half)

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

function intersectLineWithSquareBorder(
  center: { x: number; y: number },
  target: { x: number; y: number },
  half: number
) {
  const dx = target.x - center.x
  const dy = target.y - center.y

  if (dx === 0 && dy === 0) return { x: center.x, y: center.y }

  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)
  const scale = half / Math.max(absDx, absDy)
  return {
    x: center.x + dx * scale,
    y: center.y + dy * scale,
  }
}
