import { createSignal, onMount } from "solid-js"
import { GRAPH_DATA_URL } from "~/config"
import CrosshairIcon from "~/icons/CrosshairIcon"
import ShareIcon from "~/icons/ShareIcon"
import WikidataMonogram from "~/icons/WikidataMonogram"
import ZoomInIcon from "~/icons/ZoomInIcon"
import ZoomOutIcon from "~/icons/ZoomOutIcon"
import { useGraphList } from "~/pages/useGraphList"
import { GraphAdapter } from "./dataAdapter"
import { GraphpediaDataSource } from "./dataSource"
import styles from "./Graph.module.css"
import { GraphTile } from "./GraphEngine/types"
import { useGraphEngine } from "./useGraphEngine"

export default function Graph(props: { graphId: string }) {
  let containerRef: HTMLDivElement | undefined
  const [tiles, setTiles] = createSignal<GraphTile[]>()

  const graphList = useGraphList()
  const graphInfo = () => graphList()?.find((g) => g.id === props.graphId)

  onMount(async () => {
    const dataSource = new GraphpediaDataSource(GRAPH_DATA_URL, props.graphId)
    const graph = new GraphAdapter(dataSource)
    const result = await graph.tiles()
    setTiles(result)
  })

  useGraphEngine(() => containerRef, tiles)

  return (
    <div class="relative h-full w-full">
      <div ref={containerRef} class="h-full w-full" />
      <div class="absolute top-0 left-0">
        <a
          href="/"
          class="flex flex-col items-center gap-0.5 bg-white shadow-sm"
        >
          <img src="/graphpedia.svg" class="h-14 w-14" />
          <img src="/graphpedia-wordmark.svg" class="h-auto w-14" />
        </a>
      </div>
      <div class="absolute top-0 left-1/2 -translate-x-1/2 border-x border-b border-gray-300 bg-white px-1 shadow-sm">
        <h1 class="mb-0 text-lg font-semibold">
          {graphInfo()?.label} ({graphInfo()?.id})
        </h1>
      </div>
      <div class="pointer-events-none absolute right-2 bottom-2 flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <button
            onClick={() => {}}
            class={styles.control}
            data-tooltip="Reset view"
            data-placement="left"
          >
            <CrosshairIcon />
          </button>
          <button
            onClick={() => {}}
            class={styles.control}
            data-tooltip="Zoom in"
            data-placement="left"
          >
            <ZoomInIcon />
          </button>
          <button
            onClick={() => {}}
            class={styles.control}
            data-tooltip="Zoom out"
            data-placement="left"
          >
            <ZoomOutIcon />
          </button>
        </div>
        <div class="flex flex-col gap-1">
          <a
            href={`https://www.wikidata.org/wiki/Property:${props.graphId}`}
            target="_blank"
            role="button"
            class={styles.control}
            data-tooltip="View on Wikidata"
            data-placement="left"
          >
            <WikidataMonogram />
          </a>
          <button
            onClick={() => {}}
            class={styles.control}
            data-tooltip="Share this graph"
            data-placement="left"
          >
            <ShareIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
