import * as PIXI from "pixi.js"
import { DrawHandle, GraphVisuals } from "../types"

function renderLine(x1: number, y1: number, x2: number, y2: number) {
  const graphics = new PIXI.Graphics()
  graphics.moveTo(x1, y1)
  graphics.lineTo(x2, y2)
  graphics.stroke({ color: 0xff0000, width: 2 })
  return graphics
}

function renderEdge(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  arrowHeadTexture: PIXI.Texture
) {
  const dx = x2 - x1
  const dy = y2 - y1
  const angle = Math.atan2(dy, dx)

  const edgeGraphics = renderLine(x1, y1, x2, y2)

  const arrowHeadSprite = new PIXI.Sprite(arrowHeadTexture)
  arrowHeadSprite.scale.set(0.2)
  arrowHeadSprite.anchor.set(1, 0.5)
  arrowHeadSprite.x = x2
  arrowHeadSprite.y = y2
  arrowHeadSprite.rotation = angle

  edgeGraphics.addChild(arrowHeadSprite)

  return edgeGraphics
}

export default class EdgeVisual implements DrawHandle {
  private graphics: PIXI.Graphics

  constructor(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    config: GraphVisuals
  ) {
    x1 = x1 + config.nodeSize / 2
    y1 = y1 + config.nodeSize / 2
    x2 = x2 + config.nodeSize / 2
    y2 = y2 + config.nodeSize / 2
    this.graphics = renderEdge(x1, y1, x2, y2, config.arrowHeadTexture)
  }

  addToContainer(container: PIXI.Container) {
    container.addChild(this.graphics)
  }

  remove() {
    this.graphics.removeFromParent()
  }
}
