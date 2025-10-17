import { createEffect, createSignal, onCleanup, onMount } from "solid-js"
import { GRAPH_DATA_URL } from "~/config"
import CrosshairIcon from "~/icons/CrosshairIcon"
import ShareIcon from "~/icons/ShareIcon"
import WikidataMonogram from "~/icons/WikidataMonogram"
import ZoomInIcon from "~/icons/ZoomInIcon"
import ZoomOutIcon from "~/icons/ZoomOutIcon"
import { useGraphList } from "~/pages/useGraphList"
import { GraphAdapter } from "./dataAdapter"
import { GraphpediaDataSource } from "./dataSource"
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

  const { graphView } = useGraphEngine(() => containerRef, tiles)

  const zoomLevels = [0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2, 3, 4, 6, 8]

  const [currentZoom, setCurrentZoom] = createSignal(1)

  createEffect(() => {
    const view = graphView()
    if (!view) return

    const handler = () => setCurrentZoom(view.getZoom())
    view.onViewportZoomedEnd(handler)

    onCleanup(() => {
      view.offViewportZoomedEnd(handler)
    })
  })

  const nextZoomIn = () =>
    zoomLevels.find((level) => level > currentZoom()) ?? zoomLevels.at(-1)!

  const nextZoomOut = () =>
    [...zoomLevels].reverse().find((level) => level < currentZoom()) ??
    zoomLevels[0]

  const [showZoomIndicator, setShowZoomIndicator] = createSignal(false)
  let zoomTimeout: number | undefined

  createEffect(() => {
    currentZoom()
    setShowZoomIndicator(true)
    clearTimeout(zoomTimeout)
    zoomTimeout = window.setTimeout(() => setShowZoomIndicator(false), 1200)
    onCleanup(() => clearTimeout(zoomTimeout))
  })

  const [shareModalOpen, setShareModalOpen] = createSignal(false)

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
      <div
        class="absolute top-0 left-1/2 -translate-x-1/2 border-x border-b border-gray-300 bg-white px-1 shadow-sm"
        data-tooltip={`${graphInfo()?.label} (${graphInfo()?.id}): ${graphInfo()?.description}`}
        data-placement="bottom"
      >
        <h1 class="mb-0 text-lg font-semibold">
          {graphInfo()?.label} ({graphInfo()?.id})
        </h1>
      </div>
      <div class="pointer-events-none absolute right-2 bottom-2 flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <button
            onClick={() => graphView()?.resetView()}
            class="pointer-events-auto grid h-7 w-7 place-items-center border-0 bg-black/80 p-0 [&>svg]:h-4.5 [&>svg]:w-4.5"
            data-tooltip="Reset view"
            data-placement="left"
          >
            <CrosshairIcon />
          </button>
          <button
            onClick={() => graphView()?.setZoom(nextZoomIn())}
            class="pointer-events-auto grid h-7 w-7 place-items-center border-0 bg-black/80 p-0 [&>svg]:h-4.5 [&>svg]:w-4.5"
            data-tooltip="Zoom in"
            data-placement="left"
          >
            <ZoomInIcon />
          </button>
          <button
            onClick={() => graphView()?.setZoom(nextZoomOut())}
            class="pointer-events-auto grid h-7 w-7 place-items-center border-0 bg-black/80 p-0 [&>svg]:h-4.5 [&>svg]:w-4.5"
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
            class="pointer-events-auto grid h-7 w-7 place-items-center border-0 bg-black/80 p-0 [&>svg]:h-4.5 [&>svg]:w-4.5"
            data-tooltip="View on Wikidata"
            data-placement="left"
          >
            <WikidataMonogram />
          </a>
          <button
            onClick={() => setShareModalOpen(true)}
            class="pointer-events-auto grid h-7 w-7 place-items-center border-0 bg-black/80 p-0 [&>svg]:h-4.5 [&>svg]:w-4.5"
            data-tooltip="Share this graph"
            data-placement="left"
          >
            <ShareIcon />
          </button>
        </div>
      </div>
      <div
        class="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 rounded-lg bg-black/60 px-3 py-1 text-sm text-white transition-opacity duration-400"
        classList={{ "opacity-0": !showZoomIndicator() }}
      >
        Zoom: {(currentZoom() * 100).toFixed(0)}%
      </div>
      <dialog open={shareModalOpen()} onClick={() => setShareModalOpen(false)}>
        <article onClick={(e) => e.stopPropagation()}>
          <header>
            <button
              aria-label="Close"
              // @ts-ignore
              rel="prev"
              onClick={() => setShareModalOpen(false)}
            ></button>
            <p>
              <strong>Share graph</strong>
            </p>
          </header>
          <p>Blablablah blah blablah blah</p>
        </article>
      </dialog>
    </div>
  )
}
