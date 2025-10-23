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
import tippy, { Instance, Props, sticky } from "tippy.js"
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

  constructor(
    private props: NodeViewProps,
    shadowTexture: Texture
  ) {
    super({ x: props.x, y: props.y, interactive: true, cursor: "pointer" })

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

    this.on("pointerover", this.handlePointerOver)
    this.on("pointertap", this.handlePointerTap)
  }

  private handlePointerOver(event: FederatedPointerEvent) {
    if (!isEventFromCanvas(event)) return

    const overlay = new NodeOverlay(this.radiusX * 2, this.radiusY * 2)
    this.addChild(overlay)

    let tooltip: NodeTooltip | undefined

    // Wait a frame to ensure the element is in the DOM
    requestAnimationFrame(() => {
      tooltip = new NodeTooltip(
        overlay.element,
        this.props.label,
        this.props.description,
        this.props.wikidataId
      )
    })

    const cleanupTooltip = () => {
      tooltip?.destroy()
      this.removeChild(overlay)
    }

    this.once("removed", cleanupTooltip)

    this.once("pointerout", () => {
      cleanupTooltip()
      this.off("removed", cleanupTooltip)
    })
  }

  private handlePointerTap() {
    console.log("hello")
    const popup = new NodePopup(
      this.props.label,
      this.props.description,
      this.props.url,
      this.props.wikidataId,
      this.props.wikidataUrl
    )
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
    element.style.backgroundColor = "rgba(255, 255, 64, 0.25)"

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
  private instance: Instance<Props>

  constructor(
    target: Element,
    label: string | undefined,
    description: string | undefined,
    wikidataId: string
  ) {
    const content = html`
      <header class="text-sm font-semibold">
        ${label
          ? `${label} <span class="text-xs opacity-80">(${wikidataId})</span>`
          : `${wikidataId}`}
      </header>
      <p class="mb-0 text-xs">${description}</p>
    `

    this.instance = tippy(target, {
      theme: "light-border",
      content: content,
      allowHTML: true,
      sticky: true,
      plugins: [sticky],
    })

    this.instance.show()
  }

  destroy() {
    this.instance.destroy()
  }
}

const ExternalLinkIcon = `
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    fill="currentColor"
    viewBox="0 0 256 256"
  >
    <path
      d="M224,104a8,8,0,0,1-16,0V59.32l-66.33,66.34a8,8,0,0,1-11.32-11.32L196.68,48H152a8,8,0,0,1,0-16h64a8,8,0,0,1,8,8Zm-40,24a8,8,0,0,0-8,8v72H48V80h72a8,8,0,0,0,0-16H48A16,16,0,0,0,32,80V208a16,16,0,0,0,16,16H176a16,16,0,0,0,16-16V136A8,8,0,0,0,184,128Z"
    ></path>
  </svg>
`

class NodePopup {
  constructor(
    label: string | undefined,
    description: string | undefined,
    url: string,
    wikidataId: string,
    wikidataUrl: string
  ) {
    const content = html`
      <dialog open>
        <article>
          <header>
            <button aria-label="Close" rel="prev"></button>
            <p class="font-semibold">
              ${label
                ? `${label}`
                : `<span class="opacity-60">No label defined</span>`}
              <small class="opacity-80">(${wikidataId})</small>
            </p>
          </header>
          <p>
            ${description
              ? description
              : `<span class="opacity-60">No description defined</span>`}
          </p>
          <p>
            <a
              href="${wikidataUrl}"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1"
            >
              View on Wikidata ${ExternalLinkIcon}
            </a>
          </p>
          <footer>
            <a href="${url}" target="_blank" rel="noopener noreferrer"
              >${url}</a
            >
          </footer>
        </article>
      </dialog>
    `
    const template = document.createElement("template")
    template.innerHTML = content.trim()
    const node = template.content.firstElementChild

    if (node) {
      document.body.appendChild(node)

      const dialog = node as HTMLDialogElement
      const article = dialog.querySelector("article")
      const closeButton = dialog.querySelector("button")

      closeButton?.addEventListener("click", () => {
        dialog.open = false
      })

      dialog.addEventListener("click", () => {
        dialog.open = false
      })

      article?.addEventListener("click", (event) => {
        event.stopPropagation()
      })
    }
  }
}
