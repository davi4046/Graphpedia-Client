import * as PIXI from "pixi.js"
import { CancellablePromise, DrawHandle, Entity, GraphStyle } from "../types"

function renderNode(x: number, y: number, size: number) {
  const sprite = new PIXI.Sprite(PIXI.Texture.WHITE)
  sprite.tint = 0x00ff00
  sprite.width = size
  sprite.height = size
  sprite.x = x
  sprite.y = y
  return sprite
}

function fitTextToBounds(
  text: PIXI.Text,
  x: number,
  y: number,
  maxSize: number
): PIXI.Text {
  // Center anchor
  text.anchor.set(0.5)
  text.x = x + maxSize / 2
  text.y = y + maxSize / 2

  // Fit within bounds
  const maxWidth = maxSize * 0.8
  const maxHeight = maxSize * 0.8

  const scaleX = maxWidth / text.width
  const scaleY = maxHeight / text.height
  const scale = Math.min(scaleX, scaleY, 1)

  text.scale.set(scale)
  return text
}

export default class NodeVisual implements DrawHandle {
  private visual: PIXI.Container
  private data: CancellablePromise<Entity>

  constructor(
    x: number,
    y: number,
    data: CancellablePromise<Entity>,
    container: PIXI.Container,
    style: GraphStyle
  ) {
    const visual = new PIXI.Container()

    const sprite = renderNode(x, y, style.nodeSize)

    visual.addChild(sprite)
    container.addChild(visual)

    this.visual = visual
    this.data = data

    data.then((entityData) => {
      if (entityData._branch === "MissingEntity") {
        console.warn(`Entity with ID ${entityData.id} not found`)
        return
      }

      const text = new PIXI.Text({
        text: entityData.name,
        style: {
          fontSize: 16,
          fill: 0x000000,
          align: "center",
          wordWrap: true,
          wordWrapWidth: style.nodeSize * 0.8,
        },
      })

      fitTextToBounds(text, x, y, style.nodeSize)
      visual.addChild(text)
    })
  }

  remove() {
    this.visual.removeFromParent()
    this.data.cancel() // Cancel the data fetch if still pending
  }

  static createFactory(container: PIXI.Container, style: GraphStyle) {
    return (x: number, y: number, data: CancellablePromise<Entity>) => {
      return new NodeVisual(x, y, data, container, style)
    }
  }
}
