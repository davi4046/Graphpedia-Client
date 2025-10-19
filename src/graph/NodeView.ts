import * as PIXI from "pixi.js"

export default class NodeView {
  private root: PIXI.Container
  private radiusX: number
  private radiusY: number

  constructor(
    private container: PIXI.Container,
    private labelText: string,
    readonly positionX: number,
    readonly positionY: number
  ) {
    this.root = new PIXI.Container()
    this.container.addChild(this.root)

    const label = new PIXI.BitmapText({
      text: this.labelText,
      style: {
        fontFamily: "Arial",
        fontSize: 5,
        fill: 0x000000,
      },
      x: positionX,
      y: positionY,
      anchor: 0.5,
    })

    const bounds = label.getLocalBounds()
    const width = bounds.width + 4
    const height = bounds.height + 4
    const radiusX = width / 2
    const radiusY = height / 2

    const background = new PIXI.Graphics()
    background.ellipse(positionX, positionY, radiusX, radiusY)
    background.fill({ color: 0xffffff })
    background.stroke({ color: 0xd3d3d3, width: 0.5 })

    const shadow = NodeView.createShadowSprite(
      positionX,
      positionY,
      radiusX,
      radiusY
    )

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

  private static readonly BASE_SHADOW_WIDTH = 96
  private static readonly BASE_SHADOW_HEIGHT = 32
  private static readonly BASE_SHADOW_MARGIN = 16

  private static shadowTexture: PIXI.RenderTexture | null = null

  static initShadowTexture(renderer: PIXI.Renderer) {
    if (NodeView.shadowTexture) return

    const {
      BASE_SHADOW_WIDTH: width,
      BASE_SHADOW_HEIGHT: height,
      BASE_SHADOW_MARGIN: margin,
    } = NodeView

    const shadowGraphics = new PIXI.Graphics()
      .ellipse(width + margin, height + margin, width, height)
      .fill({ color: 0x000000, alpha: 0.5 })

    const blurFilter = new PIXI.BlurFilter({ strength: 12, quality: 4 })
    shadowGraphics.filters = [blurFilter]

    const shadowTexture = PIXI.RenderTexture.create({
      width: (width + margin) * 2,
      height: (height + margin) * 2,
    })

    renderer.render({
      container: shadowGraphics,
      target: shadowTexture,
    })

    NodeView.shadowTexture = shadowTexture
  }

  private static createShadowSprite(
    x: number,
    y: number,
    width: number,
    height: number
  ): PIXI.Sprite {
    const {
      BASE_SHADOW_WIDTH,
      BASE_SHADOW_HEIGHT,
      BASE_SHADOW_MARGIN,
      shadowTexture,
    } = NodeView

    if (!shadowTexture) {
      throw new Error("NodeView shadow texture is not initialized")
    }

    const shadowSprite = new PIXI.Sprite(shadowTexture)
    const shadowScaleX = width / BASE_SHADOW_WIDTH
    const shadowScaleY = height / BASE_SHADOW_HEIGHT
    shadowSprite.scale.set(shadowScaleX, shadowScaleY)
    const marginX = shadowScaleX * BASE_SHADOW_MARGIN
    const marginY = shadowScaleY * BASE_SHADOW_MARGIN
    shadowSprite.x = x - width - marginX + 1.5
    shadowSprite.y = y - height - marginY + 1.5

    return shadowSprite
  }
}
