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

    const angle = Math.atan2(endY - startY, endX - startX)

    const line = new PIXI.Graphics()
    line.moveTo(startX, startY)
    line.lineTo(endX, endY)
    line.stroke({ color: 0xff0000, width: 2 })

    this.root.addChild(line)

    const head = new PIXI.Sprite(PIXI.Texture.WHITE) // TODO: Replace with arrowhead texture
    head.scale.set(0.2)
    head.anchor.set(1, 0.5)
    head.x = endX
    head.y = endY
    head.rotation = angle

    this.root.addChild(head)
  }

  remove() {
    this.container.removeChild(this.root)
  }

  setLOD(level: number) {
    // TODO
  }
}
