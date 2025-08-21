import RBush from "rbush"
import { Node } from "../types"

interface NodeBBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
  entityId: number
}

export default class NodeSpatialIndex {
  private index: RBush<NodeBBox> = new RBush()

  insert(node: Node) {
    const nodeBBox: NodeBBox = {
      minX: node.x,
      minY: node.y,
      maxX: node.x,
      maxY: node.y,
      entityId: node.entityId,
    }
    this.index.insert(nodeBBox)
  }

  search(minX: number, minY: number, maxX: number, maxY: number): Node[] {
    return this.index.search({ minX, minY, maxX, maxY }).map((bbox) => ({
      entityId: bbox.entityId,
      x: bbox.minX,
      y: bbox.minY,
    }))
  }
}
