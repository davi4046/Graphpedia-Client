import { Container, Graphics } from "pixi.js"
import NodeView from "./NodeView"

export default class EdgeView extends Container {
  private line: Graphics

  constructor(source: NodeView, target: NodeView) {
    super()

    const startX = source.x
    const startY = source.y

    const { x: endX, y: endY } = target.intersectBorderFromPoint(startX, startY)

    this.line = new Graphics()
    this.line.moveTo(startX, startY)
    this.line.lineTo(endX, endY)

    const arrowSize = 5
    const notchInset = 4

    const angle = Math.atan2(endY - startY, endX - startX)

    const leftAngle = angle + Math.PI - Math.PI / 12
    const rightAngle = angle + Math.PI + Math.PI / 12

    const leftX = endX + Math.cos(leftAngle) * arrowSize
    const leftY = endY + Math.sin(leftAngle) * arrowSize
    const rightX = endX + Math.cos(rightAngle) * arrowSize
    const rightY = endY + Math.sin(rightAngle) * arrowSize
    const notchX = endX - Math.cos(angle) * notchInset
    const notchY = endY - Math.sin(angle) * notchInset

    this.line.moveTo(leftX, leftY)
    this.line.lineTo(endX, endY)
    this.line.lineTo(rightX, rightY)
    this.line.lineTo(notchX, notchY)
    this.line.closePath()

    this.line.fill({ color: 0xffffff })
    this.line.stroke({ color: 0xffffff, width: 0.4 })
    this.line.tint = 0xbfbfbf

    this.addChild(this.line)
  }
}
