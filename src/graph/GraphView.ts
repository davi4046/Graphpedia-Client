import * as PIXIViewport from "pixi-viewport"
import { Application, Container, EventEmitter, Texture } from "pixi.js"
import EdgeView from "./EdgeView"
import EllipticShadow from "./EllipticShadow"
import NodeView from "./NodeView"

export interface NodeMeta {
  get outgoingEdges(): EdgeView[]
  get incomingEdges(): EdgeView[]
}

type GraphViewEvents = {
  viewportMoved: () => void
}

export default class GraphView extends EventEmitter<GraphViewEvents> {
  private highlightedNode: NodeView | null = null
  private highlightedEdges: Set<EdgeView> = new Set()

  private constructor(
    private app: Application,
    private viewport: PIXIViewport.Viewport,
    private nodeContainer: Container,
    private edgeContainer: Container,
    private nodeShadowTexture: Texture
  ) {
    super()
    this.viewport.on("moved", () => this.emit("viewportMoved"))
  }

  static async create(container: HTMLElement) {
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

  addNode(x: number, y: number, label: string, meta: NodeMeta) {
    const nodeView = new NodeView(x, y, label, this.nodeShadowTexture)
    this.nodeContainer.addChild(nodeView)

    nodeView.on("pointerover", () => {
      this.highlightedNode?.setHighlighted(false)
      this.highlightedNode = nodeView
      this.highlightedNode.setHighlighted(true)
      this.nodeContainer.addChild(nodeView) // bring to front
      const edges = [...meta.outgoingEdges, ...meta.incomingEdges]
      this.highlightedEdges.forEach((edge) => edge.setHighlighted(false))
      this.highlightedEdges.clear()
      edges.forEach((edge) => {
        edge.setHighlighted(true)
        this.highlightedEdges.add(edge)
      })
    })

    nodeView.on("pointerout", () => {
      if (nodeView === this.highlightedNode) {
        nodeView.setHighlighted(false)
        this.highlightedNode = null
        this.highlightedEdges.forEach((edge) => edge.setHighlighted(false))
        this.highlightedEdges.clear()
      }
    })

    return nodeView
  }

  addEdge(source: NodeView, target: NodeView) {
    const edgeView = new EdgeView(source, target)
    this.edgeContainer.addChild(edgeView)

    if (source === this.highlightedNode || target === this.highlightedNode) {
      edgeView.setHighlighted(true)
      this.highlightedEdges.add(edgeView)
    }

    return edgeView
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
