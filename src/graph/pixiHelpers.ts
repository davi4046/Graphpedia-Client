import { Container, FederatedPointerEvent } from "pixi.js"

declare global {
  interface Window {
    _handleContextMenu?: (event: MouseEvent) => void
  }
}

let preventContextMenu = false

if (typeof window !== "undefined") {
  window._handleContextMenu = (event) => {
    if (preventContextMenu) event.preventDefault()
  }
  document.removeEventListener("contextmenu", window._handleContextMenu, {
    capture: true,
  })
  document.addEventListener("contextmenu", window._handleContextMenu, {
    capture: true,
  })
}

export function isEventFromCanvas(event: FederatedPointerEvent) {
  return event.nativeEvent.target instanceof HTMLCanvasElement
}

export function onContextMenuMouseEvent(
  container: Container,
  callback: (event: PointerEvent) => void
) {
  container.on("rightup", (event) => {
    if (!isEventFromCanvas(event)) return

    preventContextMenu = true

    setTimeout(() => {
      preventContextMenu = false
    }, 1)

    callback(event)
  })
}

export function onContextMenuTouchEvent(
  container: Container,
  callback: (event: PointerEvent) => void
) {
  let isTouching = false

  const touchEndHandler = () => {
    isTouching = false
  }

  const contextMenuHandler = (event: PointerEvent) => {
    if (event.pointerType !== "touch") return
    if (!isTouching) return
    event.preventDefault()
    callback(event)
  }

  container.on("touchstart", () => {
    isTouching = true
  })

  document.addEventListener("touchend", touchEndHandler)
  document.addEventListener("contextmenu", contextMenuHandler)

  container.on("destroy", () => {
    document.removeEventListener("touchend", touchEndHandler)
    document.removeEventListener("contextmenu", contextMenuHandler)
  })
}
