import { Accessor, createEffect, createSignal, onCleanup } from "solid-js"

export default function useSignalPulse(
  trigger: Accessor<any>,
  duration: number
) {
  const [active, setActive] = createSignal(false)
  let timeout: number | undefined

  createEffect(() => {
    trigger()
    setActive(true)
    clearTimeout(timeout)
    timeout = window.setTimeout(() => setActive(false), duration)
  })

  onCleanup(() => clearTimeout(timeout))

  return active
}
