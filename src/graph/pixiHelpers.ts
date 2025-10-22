import { FederatedPointerEvent } from "pixi.js"

export function isEventFromCanvas(event: FederatedPointerEvent) {
  return event.nativeEvent.target instanceof HTMLCanvasElement
}
