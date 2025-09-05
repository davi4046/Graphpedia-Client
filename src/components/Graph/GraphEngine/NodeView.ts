import * as PIXI from "pixi.js"

export interface NodeViewOptions {
  x: number
  y: number
  size: number
  fill: PIXI.FillInput
  stroke: PIXI.StrokeInput
  labelStyle: PIXI.TextStyleOptions
}

export default class NodeView {
  private root: PIXI.Container
  private label: PIXI.Text

  constructor(
    private container: PIXI.Container,
    private options: NodeViewOptions
  ) {
    this.root = new PIXI.Container()
    this.container.addChild(this.root)

    const graphics = this.createGraphics()
    this.root.addChild(graphics)

    this.label = this.createLabel()
    this.root.addChild(this.label)
  }

  private createLabel() {
    const text = new PIXI.Text({ style: this.options.labelStyle })

    text.x = this.options.x + this.options.size / 2
    text.y = this.options.y + this.options.size / 2
    text.anchor.set(0.5)
    text.resolution = 3

    text.style.fontSize = 16
    text.style.align = "center"
    text.style.wordWrap = true
    text.style.wordWrapWidth = this.options.size * 0.8

    return text
  }

  private createGraphics() {
    const minX = this.options.x
    const minY = this.options.y
    const maxX = this.options.x + this.options.size
    const maxY = this.options.y + this.options.size

    const graphics = new PIXI.Graphics()
    graphics.moveTo(minX, minY)
    graphics.lineTo(maxX, minY)
    graphics.lineTo(maxX, maxY)
    graphics.lineTo(minX, maxY)
    graphics.closePath()

    graphics.fill(this.options.fill)
    graphics.stroke(this.options.stroke)

    return graphics
  }

  updateLabelText(newText: string) {
    this.label.text = newText
    fitTextToBounds(
      this.label,
      this.options.size * 0.8,
      this.options.size * 0.8
    )
  }

  remove() {
    this.container.removeChild(this.root)
  }
}

function fitTextToBounds(text: PIXI.Text, maxWidth: number, maxHeight: number) {
  const scaleX = maxWidth / text.width
  const scaleY = maxHeight / text.height
  const scale = Math.min(scaleX, scaleY, 1)
  text.scale.set(scale)
}
