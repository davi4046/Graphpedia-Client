import { Node } from "../types"

export default class NodePositionMap {
  private map: Map<number, [x: number, y: number]> = new Map()

  setPosition(node: Node): void {
    this.map.set(node.entityId, [node.x, node.y])
  }

  getPosition(entityId: number): [number, number] | undefined {
    return this.map.get(entityId)
  }
}
