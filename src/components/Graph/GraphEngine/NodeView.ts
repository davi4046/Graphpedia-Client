import * as PIXI from "pixi.js"

export interface NodeViewOptions {
  x: number
  y: number
}

export default class NodeView {
  private root: PIXI.Container
  private label: PIXI.Text
  private background: PIXI.Graphics
  private dropshadow: PIXI.Graphics

  constructor(
    private container: PIXI.Container,
    private options: NodeViewOptions
  ) {
    this.root = new PIXI.Container()
    this.container.addChild(this.root)

    this.dropshadow = new PIXI.Graphics()
    this.dropshadow.filters = [new PIXI.BlurFilter()]
    this.root.addChild(this.dropshadow)

    this.background = new PIXI.Graphics()
    this.root.addChild(this.background)

    const style = { fontSize: 6, fill: "black" }
    this.label = new PIXI.Text({ style })
    this.label.anchor.set(0.5)
    this.label.x = this.options.x
    this.label.y = this.options.y
    this.label.resolution = 4
    this.root.addChild(this.label)

    this.updateBackground()
  }

  private updateBackground() {
    const bounds = this.label.getLocalBounds()
    const width = bounds.width + 4
    const height = bounds.height + 4

    const x = this.options.x
    const y = this.options.y
    const radiusX = width / 2
    const radiusY = height / 2

    this.background.clear()
    this.background.ellipse(x, y, radiusX, radiusY)
    this.background.fill({ color: "white" })
    this.background.stroke({ color: "lightgrey", width: 1 })

    this.dropshadow.clear()
    this.dropshadow.ellipse(x + 3, y + 3, radiusX, radiusY)
    this.dropshadow.fill({ color: 0x000000, alpha: 0.3 })
  }

  updateLabelText(newText: string) {
    this.label.text = newText
    this.updateBackground()
  }

  remove() {
    this.container.removeChild(this.root)
  }
}
