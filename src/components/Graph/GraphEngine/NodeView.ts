import * as PIXI from "pixi.js"

export interface NodeViewOptions {
  x: number
  y: number
  size: number
  color: PIXI.ColorSource
}

export default class NodeView {
  private root: PIXI.Container
  private label?: PIXI.Text

  constructor(
    private container: PIXI.Container,
    private options: NodeViewOptions
  ) {
    this.root = new PIXI.Container()
    this.container.addChild(this.root)

    const sprite = new PIXI.Sprite(PIXI.Texture.WHITE)
    sprite.tint = this.options.color
    sprite.width = this.options.size
    sprite.height = this.options.size
    sprite.x = this.options.x
    sprite.y = this.options.y

    this.root.addChild(sprite)
  }

  setLabel(text: string) {
    if (this.label) {
      console.warn("Setting the label twice is not supported.")
      return
    }
    this.label = createFittedText(text, {
      minX: this.options.x,
      minY: this.options.y,
      maxX: this.options.x + this.options.size,
      maxY: this.options.y + this.options.size,
    })
    this.root.addChild(this.label)
  }

  remove() {
    this.container.removeChild(this.root)
  }

  setLOD(level: number) {
    // TODO
  }
}

function createFittedText(
  text: string,
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
): PIXI.Text {
  const style: PIXI.TextStyleOptions = {
    fontSize: 16,
    fill: 0x000000,
    align: "center",
    wordWrap: true,
    wordWrapWidth: bounds.maxX - bounds.minX,
  }

  const fittedText = new PIXI.Text({ text, style })
  fittedText.anchor.set(0.5)

  // Center the text within the bounds
  fittedText.x = (bounds.minX + bounds.maxX) / 2
  fittedText.y = (bounds.minY + bounds.maxY) / 2

  // Scale the text to fit within the bounds
  const maxWidth = bounds.maxX - bounds.minX
  const maxHeight = bounds.maxY - bounds.minY
  const scaleX = maxWidth / fittedText.width
  const scaleY = maxHeight / fittedText.height
  const scale = Math.min(scaleX, scaleY, 1)
  fittedText.scale.set(scale)

  return fittedText
}
