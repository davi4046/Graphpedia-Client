import * as PIXI from "pixi.js"

export default class NodeView {
  private root: PIXI.Container

  constructor(
    private container: PIXI.Container,
    private labelText: string,
    readonly positionX: number,
    readonly positionY: number,
    renderer: PIXI.Renderer
  ) {
    this.root = new PIXI.Container()
    this.container.addChild(this.root)

    const label = new PIXI.Text({
      text: this.labelText,
      style: { fontSize: 6, fill: "black" },
      x: positionX,
      y: positionY,
      anchor: 0.5,
      resolution: 4,
    })

    const bounds = label.getLocalBounds()
    const width = bounds.width + 4
    const height = bounds.height + 4
    const radiusX = width / 2
    const radiusY = height / 2

    const background = new PIXI.Graphics()
    background.ellipse(positionX, positionY, radiusX, radiusY)
    background.fill({ color: "white" })
    background.stroke({ color: "lightgrey", width: 0.5 })

    const shadowMargin = 12

    const shadowGraphics = new PIXI.Graphics()
    shadowGraphics.ellipse(
      radiusX + shadowMargin,
      radiusY + shadowMargin,
      radiusX,
      radiusY
    )
    shadowGraphics.fill({ color: "black", alpha: 0.5 })

    const shadowBlurFilter = new PIXI.BlurFilter()
    shadowBlurFilter.strength = 3
    shadowGraphics.filters = [shadowBlurFilter]

    const shadowTexture = PIXI.RenderTexture.create({
      width: width + shadowMargin * 2,
      height: height + shadowMargin * 2,
    })

    renderer.render({ container: shadowGraphics, target: shadowTexture })

    const shadowSprite = new PIXI.Sprite(shadowTexture)
    shadowSprite.x = positionX - radiusX - shadowMargin + 1.5
    shadowSprite.y = positionY - radiusY - shadowMargin + 1.5

    this.root.addChild(shadowSprite)
    this.root.addChild(background)
    this.root.addChild(label)
  }

  remove() {
    this.container.removeChild(this.root)
  }
}
