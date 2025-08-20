import * as PIXI from "pixi.js"
import { DrawHandle, GraphStyle } from "../types"

function renderLine(x1: number, y1: number, x2: number, y2: number) {
  const graphics = new PIXI.Graphics()
  graphics.moveTo(x1, y1)
  graphics.lineTo(x2, y2)
  graphics.stroke({ color: 0xff0000, width: 2 })
  return graphics
}

function renderArrowHead(
  x: number,
  y: number,
  angle: number,
  arrowHeadTexture: PIXI.Texture
) {
  const arrowHeadSprite = new PIXI.Sprite(arrowHeadTexture)
  arrowHeadSprite.scale.set(0.2)
  arrowHeadSprite.anchor.set(1, 0.5)
  arrowHeadSprite.x = x
  arrowHeadSprite.y = y
  arrowHeadSprite.rotation = angle
  return arrowHeadSprite
}

export default class EdgeVisual implements DrawHandle {
  private visual: PIXI.Container

  constructor(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    container: PIXI.Container,
    style: GraphStyle
  ) {
    x1 = x1 + style.nodeSize / 2
    y1 = y1 + style.nodeSize / 2
    x2 = x2 + style.nodeSize / 2
    y2 = y2 + style.nodeSize / 2

    const dx = x2 - x1
    const dy = y2 - y1
    const angle = Math.atan2(dy, dx)

    const visual = new PIXI.Container()

    const lineGraphics = renderLine(x1, y1, x2, y2)
    const arrowHead = renderArrowHead(x2, y2, angle, style.arrowHeadTexture)

    visual.addChild(lineGraphics)
    visual.addChild(arrowHead)
    container.addChild(visual)

    this.visual = visual
  }

  remove() {
    this.visual.removeFromParent()
  }

  setLOD(level: number) {
    // TODO: Implement Level of Detail (LOD) logic here
  }

  static createFactory(container: PIXI.Container, style: GraphStyle) {
    return (x1: number, y1: number, x2: number, y2: number) => {
      return new EdgeVisual(x1, y1, x2, y2, container, style)
    }
  }
}
