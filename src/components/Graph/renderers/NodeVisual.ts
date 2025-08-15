import * as PIXI from "pixi.js"
import { DrawHandle, EntityData, GraphVisuals } from "../types"

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

  constructor(
    x: number,
    y: number,
    data: Promise<EntityData>,
    config: GraphVisuals
  ) {
    this.sprite = renderNode(x, y, config.nodeSize)
  }

  addToContainer(container: PIXI.Container) {
    container.addChild(this.sprite)
  }

  remove() {
    this.sprite.removeFromParent()
  }
}
