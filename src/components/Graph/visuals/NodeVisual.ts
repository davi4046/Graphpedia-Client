import * as PIXI from "pixi.js"
import { Entity, GraphStyle, PendingRequest, Visual } from "../types"

export default class NodeVisual implements Visual {
  private node: PIXI.Container

  constructor(
    private x: number,
    private y: number,
    private request: PendingRequest<Entity>,
    private container: PIXI.Container,
    private style: GraphStyle
  ) {
    const sprite = new PIXI.Sprite(PIXI.Texture.WHITE)
    sprite.tint = 0x00ff00
    sprite.width = style.nodeSize
    sprite.height = style.nodeSize
    sprite.x = x
    sprite.y = y

    const node = new PIXI.Container()
    node.addChild(sprite)
    container.addChild(node)

    this.node = node
    this.loadEntityData()
  }

  private async loadEntityData(): Promise<void> {
    try {
      const entity = await this.request.promise
      this.setLabel(entity.name)
    } catch (error) {
      console.error("Failed to load entity data:", error)
    }
  }

  private setLabel(text: string): void {
    const labelStyle: PIXI.TextStyleOptions = {
      fontSize: 16,
      fill: 0x000000,
      align: "center",
      wordWrap: true,
      wordWrapWidth: this.style.nodeSize * 0.8,
    }

    const label = new PIXI.Text({
      text: text,
      style: labelStyle,
    })

    // Set anchor to center and position directly
    label.anchor.set(0.5)
    label.x = this.x + this.style.nodeSize / 2
    label.y = this.y + this.style.nodeSize / 2

    // Scale to fit bounds
    const maxWidth = this.style.nodeSize * 0.8
    const maxHeight = this.style.nodeSize * 0.8
    const scaleX = maxWidth / label.width
    const scaleY = maxHeight / label.height
    const scale = Math.min(scaleX, scaleY, 1)
    label.scale.set(scale)

    this.node.addChild(label)
  }

  remove() {
    this.container.removeChild(this.node)
    this.request.cancel()
  }
}
