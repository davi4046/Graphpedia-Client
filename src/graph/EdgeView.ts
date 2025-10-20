import { Container, Graphics } from "pixi.js"
import NodeView from "./NodeView"

export interface EdgeViewOptions {
  x1: number
  y1: number
  x2: number
  y2: number
}

export default class EdgeView extends Container {
  constructor(source: NodeView, target: NodeView) {
    super()

    const startX = source.x
    const startY = source.y

    const { x: endX, y: endY } = target.intersectBorderFromPoint(startX, startY)

    const line = new Graphics()
    line.moveTo(startX, startY)
    line.lineTo(endX, endY)

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

    line.moveTo(leftX, leftY)
    line.lineTo(endX, endY)
    line.lineTo(rightX, rightY)
    line.lineTo(notchX, notchY)
    line.closePath()

    line.fill({ color: 0xbfbfbf })
    line.stroke({ color: 0xbfbfbf, width: 0.5 })

    this.addChild(line)
  }
}
