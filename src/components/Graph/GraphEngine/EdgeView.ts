import * as PIXI from "pixi.js"

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
    private options: EdgeViewOptions
  ) {
    this.root = new PIXI.Container()
    this.container.addChild(this.root)

    const line = new PIXI.Graphics()
    line.moveTo(this.options.x1, this.options.y1)
    line.lineTo(this.options.x2, this.options.y2)

    const angle = Math.atan2(
      this.options.y2 - this.options.y1,
      this.options.x2 - this.options.x1
    )

    const leftAngle = angle + Math.PI - Math.PI / 7
    const rightAngle = angle + Math.PI + Math.PI / 7

    const arrowSize = 1

    const leftX = this.options.x2 + Math.cos(leftAngle) * arrowSize
    const leftY = this.options.y2 + Math.sin(leftAngle) * arrowSize
    const rightX = this.options.x2 + Math.cos(rightAngle) * arrowSize
    const rightY = this.options.y2 + Math.sin(rightAngle) * arrowSize

    line.moveTo(leftX, leftY)
    line.lineTo(this.options.x2, this.options.y2)
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
