import * as PIXI from "pixi.js"

export function renderNode(x: number, y: number, size: number) {
  const sprite = new PIXI.Sprite(PIXI.Texture.WHITE)
  sprite.tint = 0x00ff00
  sprite.width = size
  sprite.height = size
  sprite.x = x
  sprite.y = y
  return sprite
}
