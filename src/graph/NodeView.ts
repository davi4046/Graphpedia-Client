import {
  BitmapFont,
  BitmapText,
  Container,
  Graphics,
  Sprite,
  Texture,
} from "pixi.js"

if (typeof window !== "undefined") {
  BitmapFont.install({
    name: "NodeLabelFont",
    style: {
      fontFamily: "Arial",
      fill: 0x000000,
    },
    resolution: 4,
  })
}

export default class NodeView extends Container {
  private radiusX: number
  private radiusY: number

  constructor(x: number, y: number, labelText: string, shadowTexture: Texture) {
    super({ x, y })

    const label = new BitmapText({
      text: labelText,
      style: {
        fontFamily: "NodeLabelFont",
        fontSize: 5,
        fill: 0x000000,
      },
      anchor: 0.5,
    })

    const bounds = label.getLocalBounds()
    this.radiusX = (bounds.width + 4) / 2
    this.radiusY = (bounds.height + 4) / 2

    const background = new Graphics()
    background.ellipse(0, 0, this.radiusX, this.radiusY)
    background.fill({ color: 0xffffff })
    background.stroke({ color: 0xbfbfbf, width: 0.5 })

    const shadow = new Sprite({
      texture: shadowTexture,
      scale: {
        x: (this.radiusX * 2) / shadowTexture.width + 0.025,
        y: (this.radiusY * 2) / shadowTexture.height + 0.05,
      },
      anchor: 0.5,
      x: 1,
      y: 1,
      eventMode: "none",
    })

    this.addChild(shadow)
    this.addChild(background)
    this.addChild(label)
  }

  intersectBorderFromPoint(fromX: number, fromY: number) {
    const dx = fromX - this.x
    const dy = fromY - this.y

    const denom = Math.sqrt(
      (dx * dx) / (this.radiusX * this.radiusX) +
        (dy * dy) / (this.radiusY * this.radiusY)
    )
    const t = 1 / denom

    return {
      x: this.x + dx * t,
      y: this.y + dy * t,
    }
  }
}
