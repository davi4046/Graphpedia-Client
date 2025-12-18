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
import tippy, { sticky, Instance as TippyInstance } from "tippy.js"
import { NodeDetails, Sitelinks } from "./GraphEngine"
import {
  isEventFromCanvas,
  onContextMenuMouseEvent,
  onContextMenuTouchEvent,
} from "./pixiHelpers"

if (typeof window !== "undefined") {
  BitmapFont.install({
    name: "NodeLabelFont",
    style: {
      fontFamily: "Arial",
      fill: 0x000000,
    },
    resolution: 2,
  })
}

export interface NodeViewProps {
  readonly label?: string
  readonly description?: string
  readonly x: number
  readonly y: number
  readonly url: string
  readonly wikidataId: string
  readonly wikidataUrl: string
  readonly sitelinks: Sitelinks
}

export default class NodeView extends Container {
  private radiusX: number
  private radiusY: number
  private nodeLabel: BitmapText
  private nodeShape: Graphics
  private nodeShadow: Sprite
  private tooltip?: NodeTooltip

  constructor(
    positionX: number,
    positionY: number,
    private props: NodeDetails,
    shadowTexture: Texture
  ) {
    super({ x: positionX, y: positionY, interactive: true, cursor: "pointer" })

    const labelText = this.props.label
      ? this.formatLabel(this.props.label)
      : this.props.wikidataId

    this.nodeLabel = new BitmapText({
      text: labelText,
      style: {
        fontFamily: "NodeLabelFont",
        fontSize: 5,
        align: "center",
      },
      anchor: 0.5,
      eventMode: "none",
    })

    const bounds = this.nodeLabel.getLocalBounds()
    this.radiusX = (bounds.width + 4) / 2
    this.radiusY = (bounds.height + 4) / 2
    this.radiusX = Math.max(this.radiusX, this.radiusY)

    this.nodeShape = new Graphics()
    this.nodeShape.clear()
    this.nodeShape.ellipse(0, 0, this.radiusX, this.radiusY)
    this.nodeShape.fill({ color: 0xffffff })
    this.nodeShape.stroke({ color: 0xbfbfbf, width: 0.4 })

    this.nodeShadow = new Sprite({
      texture: shadowTexture,
      scale: {
        x: (this.radiusX * 2) / shadowTexture.width + 0.02,
        y: (this.radiusY * 2) / shadowTexture.height + 0.04,
      },
      anchor: 0.5,
      x: 1,
      y: 1,
      eventMode: "none",
    })

    this.addChild(this.nodeShadow)
    this.addChild(this.nodeShape)
    this.addChild(this.nodeLabel)

    this.on("click", this.handleClick)

    onContextMenuMouseEvent(this, (event) => {
      new NodeContextMenu(
        { x: event.x, y: event.y },
        this.props.label ?? this.props.wikidataId,
        this.props.url,
        this.props.wikidataUrl,
        this.props.sitelinks
      )
    })

    let justOpenedContextMenu = false

    this.on("touchstart", () => {
      justOpenedContextMenu = false
    })

    this.on("touchend", (event) => {
      if (justOpenedContextMenu) return
      this.handleClick(event)
    })

    onContextMenuTouchEvent(this, (event) => {
      new NodeContextMenu(
        { x: event.x, y: event.y },
        this.props.label ?? this.props.wikidataId,
        this.props.url,
        this.props.wikidataUrl,
        this.props.sitelinks,
        { ignoreFirstHide: true }
      )
      justOpenedContextMenu = true
    })
  }

  private formatLabel(label: string): string {
    // Truncate extremely long labels
    const truncated = label.length > 70 ? label.slice(0, 67) + "..." : label

    if (truncated.length <= 35) {
      return truncated
    }

    // Find the middle point
    const middle = truncated.length / 2

    // Find spaces before and after the middle
    let beforeSpace = truncated.lastIndexOf(" ", middle)
    let afterSpace = truncated.indexOf(" ", middle)

    // If no spaces found, return original label
    if (beforeSpace === -1 && afterSpace === -1) {
      return truncated
    }

    // Choose the space closest to the middle
    let splitIndex: number
    if (beforeSpace === -1) {
      splitIndex = afterSpace
    } else if (afterSpace === -1) {
      splitIndex = beforeSpace
    } else {
      const beforeDist = middle - beforeSpace
      const afterDist = afterSpace - middle
      splitIndex = beforeDist <= afterDist ? beforeSpace : afterSpace
    }

    // Split and insert line break
    return (
      truncated.slice(0, splitIndex) + "\n" + truncated.slice(splitIndex + 1)
    )
  }

  private handleClick(event: FederatedPointerEvent) {
    if (!isEventFromCanvas(event)) return

    if (this.tooltip) return

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

  constructor(target: Element, text: string | undefined, onHidden: () => void) {
    const content = text ? html(text) : "<i>No description available</i>"

    this.tippyInstance = tippy(target, {
      content: content,
      allowHTML: true,
      theme: "light-border",
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

class NodeContextMenu {
  constructor(
    position: { x: number; y: number },
    label: string,
    url: string,
    wikidataUrl: string,
    sitelinks: Sitelinks,
    options: {
      ignoreFirstHide?: boolean
    } = {}
  ) {
    let ignoreNextHide = options.ignoreFirstHide ?? false

    const sitelinkLabels: Record<keyof Sitelinks, string> = {
      wikipedia: `"${label}" on Wikipedia`,
      wikibooks: "Textbooks (Wikibooks)",
      wikinews: "News articles (Wikinews)",
      wikiquote: "Quotations (Wikiquote)",
      wikisource: "Source texts (Wikisource)",
      wikiversity: "Learning resources (Wikiversity)",
      wikivoyage: "Travel guides (Wikivoyage)",
      wiktionary: "Dictionary entries (Wiktionary)",
      commons: "Media files (Commons)",
    }

    const hasSitelinks = Object.values(sitelinks).some(
      (link) => link !== undefined
    )

    const content = html`
      <menu class="m-0 flex list-none flex-col items-stretch p-0">
        <button
          id="copy-node-url"
          style="all: unset;"
          class="cursor-pointer px-2 py-1 hover:bg-gray-100"
        >
          Copy Node URL
        </button>
        ${hasSitelinks ? `<hr class="my-0.5"/>` : ``}
        ${Object.entries(sitelinks)
          .filter(([_, link]) => link)
          .map(
            ([key, link]) => `
              <a
                href="${link}"
                target="_blank"
                rel="noopener noreferrer"
                style="all: unset;"
                class="cursor-pointer px-2 py-1 hover:bg-gray-100"
              >
                ${sitelinkLabels[key as keyof Sitelinks]}
              </a>
            `
          )}
        <hr class="my-0.5" />
        <a
          href="${wikidataUrl}"
          target="_blank"
          rel="noopener noreferrer"
          style="all: unset;"
          class="cursor-pointer px-2 py-1 hover:bg-gray-100"
        >
          Source (Wikidata)
        </a>
      </menu>
    `

    const element = document.createElement("div")
    element.style.position = "absolute"
    element.style.left = `${position.x}px`
    element.style.top = `${position.y}px`
    document.body.appendChild(element)

    tippy(element, {
      content: content,
      allowHTML: true,
      maxWidth: 200,

      theme: "light-border",
      placement: "right-start",
      animation: false,

      trigger: "manual",
      showOnCreate: true,
      interactive: true,

      onMount(instance) {
        instance.popper.addEventListener("click", () => {
          instance.hide()
        })

        const copyButton = instance.popper.querySelector("#copy-node-url")

        copyButton?.addEventListener("click", () => {
          navigator.clipboard.writeText(url)
        })
      },

      onHidden(instance) {
        instance.destroy()
        document.body.removeChild(element)
      },

      onHide: () => {
        if (ignoreNextHide) {
          ignoreNextHide = false
          return false
        }
      },
    })
  }
}
