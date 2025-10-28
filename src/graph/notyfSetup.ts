import { Notyf } from "notyf"

let notif: Notyf = null as any

if (typeof window !== "undefined") {
  notif = new Notyf({
    position: {
      x: "left",
      y: "bottom",
    },
    ripple: false,
  })
}

export default notif
