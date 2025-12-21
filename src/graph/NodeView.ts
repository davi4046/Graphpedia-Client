import { html } from "common-tags"
import {
  BitmapFont,
  BitmapText,
  Container,
  DOMContainer,
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

export default class NodeView extends Container {
  private radiusX: number
  private radiusY: number
  private overlay?: NodeOverlay

  constructor(
    x: number,
    y: number,
    private props: NodeDetails,
    shadowTexture: Texture
  ) {
    super({ x, y, interactive: true, cursor: "pointer" })

    const labelText = this.props.label
      ? this.formatLabel(this.props.label)
      : this.props.wikidataId

    const label = new NodeLabel({ text: labelText })

    const { width, height } = label.getLocalBounds()
    this.radiusX = (width + 4) / 2
    this.radiusY = (height + 4) / 2
    this.radiusX = Math.max(this.radiusX, this.radiusY)

    const shape = new NodeShape({
      radiusX: this.radiusX,
      radiusY: this.radiusY,
      color: 0xffffff,
      borderColor: 0xbfbfbf,
    })

    const shadow = new NodeShadow({
      radiusX: this.radiusX,
      radiusY: this.radiusY,
      texture: shadowTexture,
    })

    this.addChild(shadow)
    this.addChild(shape)
    this.addChild(label)

    const istate = new InteractionState()

    new ActivateBehavior(this, istate, () => {
      if (this.overlay) return
      this.overlay = new NodeOverlay(this.radiusX * 2, this.radiusY * 2)
      this.addChild(this.overlay)

      // Wait a frame to ensure the element is in the DOM
      requestAnimationFrame(() => {
        new NodeTooltip(this.overlay!.element, this.props.description, () => {
          this.overlay?.destroy()
          this.overlay = undefined
        })
      })
    })

    new ContextMenuBehavior(this, istate, (event) => {
      new NodeContextMenu(
        { x: event.x, y: event.y },
        this.props.label ?? this.props.wikidataId,
        this.props.url,
        this.props.wikidataUrl,
        this.props.sitelinks
      )
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

class NodeLabel extends BitmapText {
  constructor(props: { text: string }) {
    super({
      text: props.text,
      style: {
        fontFamily: "NodeLabelFont",
        fontSize: 5,
        align: "center",
      },
      anchor: 0.5,
      eventMode: "none",
    })
  }
}

class NodeShape extends Graphics {
  constructor(props: {
    radiusX: number
    radiusY: number
    color: number
    borderColor: number
  }) {
    super()
    this.ellipse(0, 0, props.radiusX, props.radiusY)
    this.fill({ color: props.color })
    this.stroke({ color: props.borderColor, width: 0.4 })
  }
}

class NodeShadow extends Sprite {
  constructor(props: { radiusX: number; radiusY: number; texture: Texture }) {
    super({
      texture: props.texture,
      scale: {
        x: (props.radiusX * 2) / props.texture.width + 0.02,
        y: (props.radiusY * 2) / props.texture.height + 0.04,
      },
      anchor: 0.5,
      x: 1,
      y: 1,
      eventMode: "none",
    })
  }
}

class InteractionState {
  suppressNextActivate = false
}

class ActivateBehavior {
  constructor(
    target: Container,
    state: InteractionState,
    handler: (event: PointerEvent) => void
  ) {
    target.on("click", (event) => {
      if (!isEventFromCanvas(event)) return
      handler(event)
    })

    target.on("touchstart", () => {
      state.suppressNextActivate = false
    })

    target.on("touchend", (event) => {
      if (state.suppressNextActivate) return
      if (!isEventFromCanvas(event)) return
      handler(event)
    })
  }
}

class ContextMenuBehavior {
  constructor(
    target: Container,
    state: InteractionState,
    handler: (event: PointerEvent) => void
  ) {
    onContextMenuMouseEvent(target, (event) => {
      handler(event)
    })

    onContextMenuTouchEvent(target, (event) => {
      state.suppressNextActivate = true
      handler(event)
    })
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
  constructor(target: Element, text: string | undefined, onHidden: () => void) {
    const content = text ? html(text) : "<i>No description available</i>"

    tippy(target, {
      content: content,
      allowHTML: true,
      theme: "light-border",
      sticky: true,
      plugins: [sticky],
      trigger: "manual",
      onHidden: onHidden,
      showOnCreate: true,
    })
  }
}

class NodeContextMenu {
  constructor(
    position: { x: number; y: number },
    label: string,
    url: string,
    wikidataUrl: string,
    sitelinks: Sitelinks
  ) {
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

    let instance: TippyInstance

    const handlePointerDown = (event: PointerEvent) => {
      if (!instance.popper.contains(event.target as Node)) {
        instance.hide()
      }
    }

    instance = tippy(element, {
      content: content,
      allowHTML: true,
      maxWidth: 200,

      theme: "light-border",
      placement: "right-start",
      animation: false,

      trigger: "manual",
      showOnCreate: true,
      interactive: true,
      hideOnClick: false,

      onMount(instance) {
        const copyButton = instance.popper.querySelector("#copy-node-url")

        copyButton?.addEventListener("click", () => {
          navigator.clipboard.writeText(url)
        })

        instance.popper.addEventListener("click", () => {
          instance.hide()
        })

        document.addEventListener("pointerdown", handlePointerDown)
      },

      onHidden(instance) {
        instance.destroy()
        document.body.removeChild(element)
        document.removeEventListener("pointerdown", handlePointerDown)
      },
    })
  }
}
