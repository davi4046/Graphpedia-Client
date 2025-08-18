import * as PIXI from "pixi.js"
import {
  CancellablePromise,
  DrawHandle,
  EntityData,
  GraphVisuals,
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
  private sprite: PIXI.Sprite
  private data: CancellablePromise<EntityData>

  constructor(
    x: number,
    y: number,
    data: CancellablePromise<EntityData>,
    container: PIXI.Container,
    config: GraphVisuals
  ) {
    this.sprite = renderNode(x, y, config.nodeSize)
    this.data = data
    container.addChild(this.sprite)
  }

  remove() {
    this.sprite.removeFromParent()
    this.data.cancel() // Cancel the data fetch if still pending
  }

  static createFactory(container: PIXI.Container, config: GraphVisuals) {
    return (x: number, y: number, data: CancellablePromise<EntityData>) => {
      return new NodeVisual(x, y, data, container, config)
    }
  }
}
