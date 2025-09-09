import * as PIXI from "pixi.js"

export interface NodeViewOptions {
  x: number
  y: number
}

export default class NodeView {
  private root: PIXI.Container
  private label: PIXI.Text
  private background: PIXI.Graphics

  constructor(
    private container: PIXI.Container,
    private options: NodeViewOptions
  ) {
    this.root = new PIXI.Container()
    this.container.addChild(this.root)

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
    this.background.clear()

    const bounds = this.label.getLocalBounds()
    const padding = 4
    const width = bounds.width + padding
    const height = bounds.height + padding

    this.background.ellipse(
      this.options.x,
      this.options.y,
      width / 2,
      height / 2
    )
    this.background.fill({ color: "white" })
    this.background.stroke({ color: "lightgrey", width: 1 })
  }

  updateLabelText(newText: string) {
    this.label.text = newText
    this.updateBackground()
  }

  remove() {
    this.container.removeChild(this.root)
  }
}
