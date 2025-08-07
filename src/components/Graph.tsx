import { Parser } from "binary-parser/lib/binary_parser.js"
import Flatbush from "flatbush"
import { Application } from "pixi.js"
import { onCleanup, onMount } from "solid-js"

const tileEntryParser = new Parser()
  .endianess("little")
  .uint16("pathLength")
  .string("path", {
    length: "pathLength",
    encoding: "utf8",
  })
  .uint32("xmin")
  .uint32("ymin")
  .uint32("xmax")
  .uint32("ymax")

const tileIndexParser = new Parser().array("entries", {
  type: tileEntryParser,
  readUntil: (_, buffer) => buffer.length === 0,
})

const nodeParser = new Parser().uint32("entity_id").uint32("x").uint32("y")
const edgeParser = new Parser().uint32("entity_id1").uint32("entity_id2")
const tileParser = new Parser()
  .uint32("numNodes")
  .array("nodes", {
    type: nodeParser,
    length: "numNodes",
  })
  .uint32("numEdges")
  .array("edges", {
    type: edgeParser,
    length: "numEdges",
  })

type GraphProps = { graphId: string }

export default function Graph(props: GraphProps) {
  let containerRef: HTMLDivElement | undefined
  let app: Application
  let index: Flatbush

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

      const blob = new Blob([compressedData])

      const decompressedStream = new DecompressionStream("gzip")

      const decompressedResponse = new Response(
        blob.stream().pipeThrough(decompressedStream)
      )

      const tileIndexData = await decompressedResponse.arrayBuffer()
      const tileIndex = tileIndexParser.parse(new Uint8Array(tileIndexData))

      index = new Flatbush(tileIndex.entries.length)

      for (const entry of tileIndex.entries) {
        const { xmin, ymin, xmax, ymax } = entry
        index.add(xmin, ymin, xmax, ymax)
      }

      index.finish()
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
