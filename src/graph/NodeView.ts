import * as PIXI from "pixi.js"

if (typeof window !== "undefined") {
  PIXI.BitmapFont.install({
    name: "NodeLabelFont",
    style: {
      fontFamily: "Arial",
      fill: 0x000000,
    },
    resolution: 4,
  })
}

export default class NodeView {
  private root: PIXI.Container
  private radiusX: number
  private radiusY: number

  constructor(
    private container: PIXI.Container,
    private labelText: string,
    readonly positionX: number,
    readonly positionY: number,
    shadowTexture: PIXI.Texture
  ) {
    this.root = new PIXI.Container()
    this.container.addChild(this.root)

    const label = new PIXI.BitmapText({
      text: this.labelText,
      style: {
        fontFamily: "NodeLabelFont",
        fontSize: 5,
        fill: 0x000000,
      },
      x: positionX,
      y: positionY,
      anchor: 0.5,
    })

    const bounds = label.getLocalBounds()
    const radiusX = (bounds.width + 4) / 2
    const radiusY = (bounds.height + 4) / 2

    const background = new PIXI.Graphics()
    background.ellipse(positionX, positionY, radiusX, radiusY)
    background.fill({ color: 0xffffff })
    background.stroke({ color: 0xd3d3d3, width: 0.5 })

    const shadow = new PIXI.Sprite(shadowTexture)
    const shadowScaleX = (radiusX * 2) / shadowTexture.width
    const shadowScaleY = (radiusY * 2) / shadowTexture.height
    shadow.scale.set(shadowScaleX, shadowScaleY)
    shadow.x = positionX - radiusX + 1
    shadow.y = positionY - radiusY + 2

    this.root.addChild(shadow)
    this.root.addChild(background)
    this.root.addChild(label)

    this.radiusX = radiusX
    this.radiusY = radiusY
  }

  remove() {
    this.container.removeChild(this.root)
  }

  intersectBorderFromPoint(fromX: number, fromY: number) {
    const dx = fromX - this.positionX
    const dy = fromY - this.positionY

    const denom = Math.sqrt(
      (dx * dx) / (this.radiusX * this.radiusX) +
        (dy * dy) / (this.radiusY * this.radiusY)
    )
    const t = 1 / denom

    return {
      x: this.positionX + dx * t,
      y: this.positionY + dy * t,
    }
  }
}
