import * as PIXI from "pixi.js"

export interface EdgeViewOptions {
  x1: number
  y1: number
  x2: number
  y2: number
  width: number
  color: PIXI.ColorSource
}

export default class EdgeView {
  private root: PIXI.Container

  constructor(
    private container: PIXI.Container,
    private options: EdgeViewOptions
  ) {
    this.root = new PIXI.Container()
    this.container.addChild(this.root)

    const startX = this.options.x1 + this.options.width / 2
    const startY = this.options.y1 + this.options.width / 2
    const endX = this.options.x2 + this.options.width / 2
    const endY = this.options.y2 + this.options.width / 2

    const line = new PIXI.Graphics()
    line.moveTo(startX, startY)
    line.lineTo(endX, endY)

    const angle = Math.atan2(endY - startY, endX - startX)

    const leftAngle = angle + Math.PI - Math.PI / 7
    const rightAngle = angle + Math.PI + Math.PI / 7

    const arrowSize = 1

    const leftX = endX + Math.cos(leftAngle) * arrowSize
    const leftY = endY + Math.sin(leftAngle) * arrowSize
    const rightX = endX + Math.cos(rightAngle) * arrowSize
    const rightY = endY + Math.sin(rightAngle) * arrowSize

    line.moveTo(leftX, leftY)
    line.lineTo(endX, endY)
    line.lineTo(rightX, rightY)
    line.closePath()

    line.stroke({
      color: this.options.color,
      width: this.options.width,
    })

    line.fill({
      color: this.options.color,
    })

    this.root.addChild(line)
  }

  remove() {
    this.container.removeChild(this.root)
  }
}
