import * as PIXI from "pixi.js"
import {
  CancellablePromise,
  DrawHandle,
  EntityData,
  GraphStyle,
} from "../types"

function renderNode(x: number, y: number, size: number) {
  const sprite = new PIXI.Sprite(PIXI.Texture.WHITE)
  sprite.tint = 0x00ff00
  sprite.width = size
  sprite.height = size
  sprite.x = x
  sprite.y = y
  return sprite
}

export default class NodeVisual implements DrawHandle {
  private visual: PIXI.Container
  private data: CancellablePromise<EntityData>

  constructor(
    x: number,
    y: number,
    data: CancellablePromise<EntityData>,
    container: PIXI.Container,
    style: GraphStyle
  ) {
    const visual = new PIXI.Container()

    const sprite = renderNode(x, y, style.nodeSize)

    visual.addChild(sprite)
    container.addChild(visual)

    this.visual = visual
    this.data = data
  }

  remove() {
    this.visual.removeFromParent()
    this.data.cancel() // Cancel the data fetch if still pending
  }

  static createFactory(container: PIXI.Container, style: GraphStyle) {
    return (x: number, y: number, data: CancellablePromise<EntityData>) => {
      return new NodeVisual(x, y, data, container, style)
    }
  }
}
