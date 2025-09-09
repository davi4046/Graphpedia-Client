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

    const angle = Math.atan2(
      this.target.positionY - this.source.positionY,
      this.target.positionX - this.source.positionX
    )

    const leftAngle = angle + Math.PI - Math.PI / 7
    const rightAngle = angle + Math.PI + Math.PI / 7

    const arrowSize = 1

    const leftX = this.target.positionX + Math.cos(leftAngle) * arrowSize
    const leftY = this.target.positionY + Math.sin(leftAngle) * arrowSize
    const rightX = this.target.positionX + Math.cos(rightAngle) * arrowSize
    const rightY = this.target.positionY + Math.sin(rightAngle) * arrowSize

    line.moveTo(leftX, leftY)
    line.lineTo(this.target.positionX, this.target.positionY)
    line.lineTo(rightX, rightY)
    line.closePath()

    line.fill({ color: "lightgrey" })
    line.stroke({ color: "lightgrey", width: 0.5 })

    this.root.addChild(line)
  }

  remove() {
    this.container.removeChild(this.root)
  }
}
