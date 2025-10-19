import { Container, Graphics } from "pixi.js"
import NodeView from "./NodeView"

export interface EdgeViewOptions {
  x1: number
  y1: number
  x2: number
  y2: number
}

export default class EdgeView {
  private root: Container

  constructor(
    private container: Container,
    private source: NodeView,
    private target: NodeView
  ) {
    this.root = new Container()
    this.container.addChild(this.root)

    const sourceX = source.positionX
    const sourceY = source.positionY

    const { x: targetX, y: targetY } = target.intersectBorderFromPoint(
      sourceX,
      sourceY
    )

    const line = new Graphics()
    line.moveTo(sourceX, sourceY)
    line.lineTo(targetX, targetY)

    const arrowSize = 5
    const notchInset = 4

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

    line.fill({ color: 0x767676 })
    line.stroke({ color: 0x767676, width: 0.5 })

    this.root.addChild(line)
  }

  remove() {
    this.container.removeChild(this.root)
  }
}
