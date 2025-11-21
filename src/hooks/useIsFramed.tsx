import { createSignal, onMount } from "solid-js"

export default function useIsFramed() {
  const [isFramed, setIsFramed] = createSignal(false)

  onMount(() => {
    try {
      setIsFramed(window.self !== window.top)
    } catch {
      // Accessing window.top can throw if the iframe is cross-origin
      setIsFramed(true)
    }
  })

  return isFramed
}
