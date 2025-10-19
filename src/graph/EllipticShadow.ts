import * as PIXI from "pixi.js"

export interface EllipticalShadowOptions {
  radiusX: number
  radiusY: number
  color: number
  alpha: number
  blurStrength: number
  blurQuality: number
}

export default class EllipticShadow {
  readonly graphics: PIXI.Graphics

  private margin: number = 12

  constructor(options: EllipticalShadowOptions) {
    const centerX = options.radiusX + this.margin
    const centerY = options.radiusY + this.margin

    const shadowGraphics = new PIXI.Graphics()
      .ellipse(centerX, centerY, options.radiusX, options.radiusY)
      .fill({ color: options.color, alpha: options.alpha })

    const blurFilter = new PIXI.BlurFilter({
      strength: options.blurStrength,
      quality: options.blurQuality,
    })

    shadowGraphics.filters = [blurFilter]

    this.graphics = shadowGraphics
  }

  renderTexture(renderer: PIXI.Renderer): PIXI.Texture {
    const texture = PIXI.RenderTexture.create({
      width: this.graphics.width + this.margin * 2,
      height: this.graphics.height + this.margin * 2,
    })

    renderer.render({
      container: this.graphics,
      target: texture,
    })

    return texture
  }
}
