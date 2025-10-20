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
  private nodeLabel: BitmapText
  private nodeShape: Graphics
  private nodeShadow: Sprite

  constructor(x: number, y: number, labelText: string, shadowTexture: Texture) {
    super({ x, y, interactive: true, cursor: "pointer" })

    this.nodeLabel = new BitmapText({
      text: labelText,
      style: {
        fontFamily: "NodeLabelFont",
        fontSize: 5,
        fill: 0x000000,
      },
      anchor: 0.5,
      eventMode: "none",
    })

    const bounds = this.nodeLabel.getLocalBounds()
    this.radiusX = (bounds.width + 4) / 2
    this.radiusY = (bounds.height + 4) / 2

    this.nodeShape = new Graphics()
    this.setStyle(0xffffff, 0xbfbfbf)

    this.nodeShadow = new Sprite({
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

    this.addChild(this.nodeShadow)
    this.addChild(this.nodeShape)
    this.addChild(this.nodeLabel)

    this.on("pointerover", () => {
      this.setStyle(0xf0f0f0, 0x808080)
    })

    this.on("pointerout", () => {
      this.setStyle(0xffffff, 0xbfbfbf)
    })
  }

  private setStyle(fill: number, stroke: number) {
    this.nodeShape.clear()
    this.nodeShape.ellipse(0, 0, this.radiusX, this.radiusY)
    this.nodeShape.fill({ color: fill })
    this.nodeShape.stroke({ color: stroke, width: 0.5 })
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
