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

    const sourceX = source.positionX
    const sourceY = source.positionY

    const { x: targetX, y: targetY } = target.intersectBorderFromPoint(
      sourceX,
      sourceY
    )

    const line = new PIXI.Graphics()
    line.moveTo(sourceX, sourceY)
    line.lineTo(targetX, targetY)

    const arrowSize = 7
    const notchInset = 6

    const angle = Math.atan2(targetY - sourceY, targetX - sourceX)

    const leftAngle = angle + Math.PI - Math.PI / 12
    const rightAngle = angle + Math.PI + Math.PI / 12

    const leftX = targetX + Math.cos(leftAngle) * arrowSize
    const leftY = targetY + Math.sin(leftAngle) * arrowSize
    const rightX = targetX + Math.cos(rightAngle) * arrowSize
    const rightY = targetY + Math.sin(rightAngle) * arrowSize
    const notchX = targetX - Math.cos(angle) * notchInset
    const notchY = targetY - Math.sin(angle) * notchInset

    line.moveTo(leftX, leftY)
    line.lineTo(targetX, targetY)
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
