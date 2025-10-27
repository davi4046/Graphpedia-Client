import { html } from "common-tags"
import {
  BitmapFont,
  BitmapText,
  Container,
  DOMContainer,
  FederatedPointerEvent,
  Graphics,
  Sprite,
  Texture,
} from "pixi.js"
import tippy, { Instance as TippyInstance, sticky } from "tippy.js"
import { isEventFromCanvas } from "./pixiHelpers"

if (typeof window !== "undefined") {
  BitmapFont.install({
    name: "NodeLabelFont",
    style: {
      fontFamily: "Arial",
      fill: 0x000000,
    },
    resolution: 4,
  })
}

export interface NodeViewProps {
  x: number
  y: number
  label?: string
  description?: string
  url: string
  wikidataId: string
  wikidataUrl: string
}

export default class NodeView extends Container {
  private radiusX: number
  private radiusY: number
  private nodeLabel: BitmapText
  private nodeShape: Graphics
  private nodeShadow: Sprite
  private tooltip?: NodeTooltip

  constructor(
    private props: NodeViewProps,
    shadowTexture: Texture
  ) {
    super({ x: props.x, y: props.y, interactive: true })

    this.nodeLabel = new BitmapText({
      text: props.label ?? props.wikidataId,
      style: {
        fontFamily: "NodeLabelFont",
        fontSize: 5,
      },
      anchor: 0.5,
      eventMode: "none",
    })

    const bounds = this.nodeLabel.getLocalBounds()
    this.radiusX = (bounds.width + 4) / 2
    this.radiusY = (bounds.height + 4) / 2

    this.nodeShape = new Graphics()
    this.nodeShape.clear()
    this.nodeShape.ellipse(0, 0, this.radiusX, this.radiusY)
    this.nodeShape.fill({ color: 0xffffff })
    this.nodeShape.stroke({ color: 0xbfbfbf, width: 0.5 })

    this.nodeShadow = new Sprite({
      texture: shadowTexture,
      scale: {
        x: (this.radiusX * 2) / shadowTexture.width + 0.025,
        y: (this.radiusY * 2) / shadowTexture.height + 0.05,
      },
      anchor: 0.5,
      x: 1,
      y: 1,
      eventMode: "none",
    })

    this.addChild(this.nodeShadow)
    this.addChild(this.nodeShape)
    this.addChild(this.nodeLabel)

    this.on("pointertap", this.handlePointerTap)
  }

  private handlePointerTap(event: FederatedPointerEvent) {
    if (!isEventFromCanvas(event)) return

    if (this.tooltip) {
      this.tooltip.hide()
      return
    }

    const overlay = new NodeOverlay(this.radiusX * 2, this.radiusY * 2)
    this.addChild(overlay)

    // Wait a frame to ensure the element is in the DOM
    requestAnimationFrame(() => {
      this.tooltip = new NodeTooltip(
        overlay.element,
        this.props.description,
        () => {
          this.tooltip?.destroy()
          this.tooltip = undefined
          overlay.destroy()
        }
      )
      this.tooltip.show()
    })
  }

  intersectBorderFromPoint(fromX: number, fromY: number) {
    const dx = fromX - this.x
    const dy = fromY - this.y

    const denom = Math.sqrt(
      (dx * dx) / (this.radiusX * this.radiusX) +
        (dy * dy) / (this.radiusY * this.radiusY)
    )
    const t = 1 / denom

    return {
      x: this.x + dx * t,
      y: this.y + dy * t,
    }
  }
}

class NodeOverlay extends DOMContainer {
  constructor(width: number, height: number) {
    const element = document.createElement("div")
    element.classList.add("pointer-events-none") // Workaround for PIXI lacking eventMode "none" on DOMContainer
    element.style.width = `${width}px`
    element.style.height = `${height}px`

    super({
      element: element,
      x: -width / 2,
      y: -height / 2,
      width: width,
      height: height,
      eventMode: "none", // Placeholder: currently not supported
    })
  }
}

class NodeTooltip {
  private tippyInstance: TippyInstance

  constructor(
    target: Element,
    description: string | undefined,
    onHidden: () => void
  ) {
    const content = html`
      <p class="mb-0">
        ${description ? description : `<i>No description available</i>`}
      </p>
    `

    this.tippyInstance = tippy(target, {
      theme: "light-border",
      content: content,
      allowHTML: true,
      sticky: true,
      plugins: [sticky],
      trigger: "manual",
      onHidden: onHidden,
    })

    this.tippyInstance.show()
  }

  show() {
    this.tippyInstance.show()
  }

  hide() {
    this.tippyInstance.hide()
  }

  destroy() {
    this.tippyInstance.destroy()
  }
}
