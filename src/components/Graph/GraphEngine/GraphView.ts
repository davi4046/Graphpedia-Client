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

  static async create(container: HTMLDivElement) {
    const app = new PIXI.Application()

    // @ts-ignore
    globalThis.__PIXI_APP__ = app

    await app.init({
      background: "white",
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

    return new GraphView(app, viewport, nodeContainer, edgeContainer)
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
      minX: x,
      minY: y,
      maxX: x + width,
      maxY: y + height,
    }
  }

  addNode(positionX: number, positionY: number) {
    return new NodeView(this.nodeContainer, positionX, positionY)
  }

  addEdge(source: NodeView, target: NodeView) {
    return new EdgeView(this.edgeContainer, source, target)
  }

  destroy() {
    this.app.destroy(true, { children: true, texture: true })
  }
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
