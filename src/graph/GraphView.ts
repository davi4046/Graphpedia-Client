import * as PIXIViewport from "pixi-viewport"
import { Application, Container, EventEmitter, Texture } from "pixi.js"
import EdgeView from "./EdgeView"
import EllipticShadow from "./EllipticShadow"
import NodeView from "./NodeView"
import { isEventFromCanvas } from "./pixiHelpers"

export interface NodeMeta {
  get outgoingEdges(): EdgeView[]
  get incomingEdges(): EdgeView[]
}

type GraphViewEvents = {
  viewportMoved: () => void
}

export default class GraphView extends EventEmitter<GraphViewEvents> {
  private hoveredNode: NodeView | null = null
  private emphasizedEdges: Set<EdgeView> = new Set()

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

  private handleNodePointerOver(node: NodeView, meta: NodeMeta) {
    this.hoveredNode = node
    this.nodeContainer.addChild(node) // bring to front

    this.emphasizedEdges.forEach((edge) => edge.setEmphasized(false))
    this.emphasizedEdges.clear()

    const edges = [...meta.outgoingEdges, ...meta.incomingEdges]

    edges.forEach((edge) => {
      edge.setEmphasized(true)
      this.emphasizedEdges.add(edge)
    })

    node.once("pointerout", () => {
      this.hoveredNode = null
      this.emphasizedEdges.forEach((edge) => edge.setEmphasized(false))
      this.emphasizedEdges.clear()
    })
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
    const node = new NodeView(x, y, label, this.nodeShadowTexture)
    this.nodeContainer.addChild(node)

    node.on("pointerover", (event) => {
      if (!isEventFromCanvas(event)) return
      this.handleNodePointerOver(node, meta)
    })

    return node
  }

  addEdge(source: NodeView, target: NodeView) {
    const edge = new EdgeView(source, target)
    this.edgeContainer.addChild(edge)

    if (source === this.hoveredNode || target === this.hoveredNode) {
      edge.setEmphasized(true)
      this.emphasizedEdges.add(edge)
    }

    return edge
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
