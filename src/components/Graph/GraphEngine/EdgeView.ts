import * as PIXI from "pixi.js"
import NodeView from "./NodeView"

export interface EdgeViewOptions {
  x1: number
  y1: number
  x2: number
  y2: number
}

export default class EdgeView {
  private root: PIXI.Container

  constructor(
    private container: PIXI.Container,
    private source: NodeView,
    private target: NodeView
  ) {
    this.root = new PIXI.Container()
    this.container.addChild(this.root)

    const line = new PIXI.Graphics()
    line.moveTo(this.source.positionX, this.source.positionY)
    line.lineTo(this.target.positionX, this.target.positionY)

    const targetPos = target.intersectBorderFromPoint(
      this.source.positionX,
      this.source.positionY
    )

    const angle = Math.atan2(
      targetPos.y - this.source.positionY,
      targetPos.x - this.source.positionX
    )

    const leftAngle = angle + Math.PI - Math.PI / 12
    const rightAngle = angle + Math.PI + Math.PI / 12

    const arrowSize = 7
    const notchInset = 6

    const leftX = targetPos.x + Math.cos(leftAngle) * arrowSize
    const leftY = targetPos.y + Math.sin(leftAngle) * arrowSize
    const rightX = targetPos.x + Math.cos(rightAngle) * arrowSize
    const rightY = targetPos.y + Math.sin(rightAngle) * arrowSize

    const notchX = targetPos.x - Math.cos(angle) * notchInset
    const notchY = targetPos.y - Math.sin(angle) * notchInset

    line.moveTo(leftX, leftY)
    line.lineTo(targetPos.x, targetPos.y)
    line.lineTo(rightX, rightY)
    line.lineTo(notchX, notchY)
    line.closePath()

    line.fill({ color: "lightgrey" })
    line.stroke({ color: "lightgrey", width: 0.5 })

    this.root.addChild(line)
  }

  remove() {
    this.container.removeChild(this.root)
  }
}
