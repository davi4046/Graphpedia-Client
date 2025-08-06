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

    try {
      const dataUrl = import.meta.env.PUBLIC_DATA_URL
      const tileIndexUrl = `${dataUrl}/graphs/${props.graphId}/tile_index.bin.gz`
      const response = await fetch(tileIndexUrl)

      if (!response.ok) {
        throw new Error(`Failed to fetch tile index: ${response.statusText}`)
      }

      const compressedData = await response.arrayBuffer()

      const decompressedStream = new DecompressionStream("gzip")
      const decompressedResponse = new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array(compressedData))
            controller.close()
          },
        }).pipeThrough(decompressedStream)
      )

      const tileIndexData = await decompressedResponse.arrayBuffer()

      // Process the tile index data
      console.log("Loaded tile index:", tileIndexData.byteLength, "bytes")

      // TODO: Parse tile index and create graph visualization
      // You can now use tileIndexData to build your graph nodes
    } catch (error) {
      console.error("Error loading tile index:", error)
    }
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
