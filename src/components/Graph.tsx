import { Application } from "pixi.js"
import { onCleanup, onMount } from "solid-js"

type GraphProps = {
  graphId: string
}

export default function Graph(props: GraphProps) {
  let containerRef: HTMLDivElement | undefined
  let app: Application

  onMount(async () => {
    app = new Application()

    await app.init({
      background: "#1099bb",
      resizeTo: window,
    })

    if (containerRef) {
      containerRef.appendChild(app.canvas)
    }

    // TODO: Load graph nodes and draw them here
    // app.stage.addChild(...);
  })

  onCleanup(() => {
    app?.destroy(true, { children: true })
  })

  return (
    <div>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  )
}
