import * as PIXI from "pixi.js"

export function renderArrowHead() {
  const triangle = new PIXI.Graphics()
  triangle.moveTo(0, 0)
  triangle.lineTo(40, 20)
  triangle.lineTo(0, 40)
  triangle.closePath()
  triangle.fill({
    color: 0xff0000,
  })
  return triangle
}
