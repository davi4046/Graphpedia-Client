import * as PIXI from "pixi.js"
import { GraphStyle, Visual } from "../types"

export default class EdgeVisual implements Visual {
  private edge: PIXI.Container

  constructor(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    container: PIXI.Container,
    style: GraphStyle
  ) {
    const startX = x1 + style.nodeSize / 2
    const startY = y1 + style.nodeSize / 2
    const endX = x2 + style.nodeSize / 2
    const endY = y2 + style.nodeSize / 2

    const angle = Math.atan2(endY - startY, endX - startX)

    const line = new PIXI.Graphics()
    line.moveTo(startX, startY)
    line.lineTo(endX, endY)
    line.stroke({ color: 0xff0000, width: 2 })

    const head = new PIXI.Sprite(style.edgeHeadTexture)
    head.scale.set(0.2)
    head.anchor.set(1, 0.5)
    head.x = endX
    head.y = endY
    head.rotation = angle

    const edge = new PIXI.Container()
    edge.addChild(line)
    edge.addChild(head)

    container.addChild(edge)
    this.edge = edge
  }

  remove() {
    this.edge.removeFromParent()
  }
}
