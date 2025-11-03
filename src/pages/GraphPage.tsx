import { debounce } from "@solid-primitives/scheduled"
import { Link, Title } from "@solidjs/meta"
import { useParams } from "@solidjs/router"
import { createEffect, createSignal, onCleanup, onMount } from "solid-js"
import { GRAPH_DATA_URL } from "~/config"
import {
  GraphDataAdapter,
  GraphDataSource,
  GraphEngine,
  GraphNodeLocator,
  GraphView,
  useGraphList,
} from "~/graph"
import CrosshairIcon from "~/icons/CrosshairIcon"
import WikidataMonogram from "~/icons/WikidataMonogram"
import ZoomInIcon from "~/icons/ZoomInIcon"
import ZoomOutIcon from "~/icons/ZoomOutIcon"

function loadViewportState(graphView: GraphView, graphId: string) {
  const saved = localStorage.getItem(`graph-viewport-${graphId}`)
  if (saved) graphView.setViewport(JSON.parse(saved))
}

function saveViewportState(graphView: GraphView, graphId: string) {
  const viewport = graphView.getViewport()
  localStorage.setItem(`graph-viewport-${graphId}`, JSON.stringify(viewport))
}

export default function GraphPage() {
  const params = useParams()
  const graphList = useGraphList()
  const graphInfo = () => graphList()?.find((g) => g.id === params.graphId)

  let container: HTMLDivElement | undefined
  const [graphView, setGraphView] = createSignal<GraphView>()

  onMount(async () => {
    if (!container) return
    const graphView = await GraphView.create(container)
    const dataSource = await GraphDataSource.create(
      GRAPH_DATA_URL,
      params.graphId
    )
    const dataAdapter = new GraphDataAdapter(dataSource)
    const graphTiles = await dataAdapter.tiles()
    const graphEngine = new GraphEngine(graphView, graphTiles)

    const nodeLocator = await GraphNodeLocator.create(dataSource)

    loadViewportState(graphView, params.graphId)

    const debouncedSave = debounce(() => {
      saveViewportState(graphView, params.graphId)
    }, 500)

    graphView.on("viewportMoved", () => {
      setZoom(graphView.getZoom())
      debouncedSave()
    })

    setGraphView(graphView)
  })

  onCleanup(() => {
    graphView()?.destroy()
  })

  const zoomLevels = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4]

  const [zoom, setZoom] = createSignal(1)

  const nextZoomIn = () =>
    zoomLevels.find((level) => level > zoom()) ?? zoomLevels.at(-1)!

  const nextZoomOut = () =>
    [...zoomLevels].reverse().find((level) => level < zoom()) ?? zoomLevels[0]

  const [showZoomStatus, setShowZoomStatus] = createSignal(false)
  let zoomTimeout: number | undefined

  createEffect(() => {
    zoom()
    setShowZoomStatus(true)
    clearTimeout(zoomTimeout)
    zoomTimeout = window.setTimeout(() => setShowZoomStatus(false), 1200)
    onCleanup(() => clearTimeout(zoomTimeout))
  })

  return (
    <>
      <Title>{`${graphInfo()?.label} - Graphpedia`}</Title>
      <Link rel="canonical" href={`/graph/${params.graphId}`} />
      <div
        ref={container}
        id="graph"
        role="application"
        aria-labelledby="graph-title"
        aria-describedby="graph-desc"
        class="absolute inset-0 -z-10"
      ></div>
      <a
        href="/"
        aria-label="Graphpedia"
        class="absolute top-0 left-0 flex flex-col items-center bg-white shadow-sm"
      >
        <img src="/graphpedia.svg" alt="" class="h-14 w-14" />
        <img src="/graphpedia-wordmark-light.svg" alt="" class="mt-0.5 w-14" />
      </a>
      <div
        data-tooltip={graphInfo()?.description}
        data-placement="bottom"
        class="absolute top-0 left-1/2 -translate-x-1/2 border-x border-b border-gray-300 bg-white shadow-sm"
      >
        <h1
          id="graph-title"
          data-template="title-tooltip"
          class="mb-0 px-1 text-lg font-semibold"
        >
          {graphInfo()?.label}
        </h1>
        <div id="graph-desc" class="sr-only">
          {graphInfo()?.description}
        </div>
      </div>
      <div
        role="toolbar"
        class="pointer-events-none absolute right-2 bottom-2 flex flex-col gap-1"
      >
        <button
          onClick={() => graphView()?.resetViewport()}
          aria-controls="graph"
          aria-label="Reset view"
          data-tooltip="Reset view"
          data-placement="left"
          class="pointer-events-auto grid h-7 w-7 place-items-center border-0 bg-black/80 p-0 [&>svg]:h-4.5 [&>svg]:w-4.5"
        >
          <CrosshairIcon />
        </button>
        <button
          onClick={() => graphView()?.setZoom(nextZoomIn())}
          aria-controls="graph"
          aria-label="Zoom in"
          data-tooltip="Zoom in"
          data-placement="left"
          class="pointer-events-auto grid h-7 w-7 place-items-center border-0 bg-black/80 p-0 [&>svg]:h-4.5 [&>svg]:w-4.5"
        >
          <ZoomInIcon />
        </button>
        <button
          onClick={() => graphView()?.setZoom(nextZoomOut())}
          aria-controls="graph"
          aria-label="Zoom out"
          data-tooltip="Zoom out"
          data-placement="left"
          class="pointer-events-auto grid h-7 w-7 place-items-center border-0 bg-black/80 p-0 [&>svg]:h-4.5 [&>svg]:w-4.5"
        >
          <ZoomOutIcon />
        </button>
        <a
          href={`https://www.wikidata.org/wiki/Property:${params.graphId}`}
          target="_blank"
          rel="noopener noreferrer"
          role="button"
          aria-label="View on Wikidata"
          data-tooltip="View on Wikidata"
          data-placement="left"
          class="pointer-events-auto grid h-7 w-7 place-items-center border-0 bg-black/80 p-0 [&>svg]:h-4.5 [&>svg]:w-4.5"
        >
          <WikidataMonogram />
        </a>
      </div>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        class="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 rounded-lg bg-black/60 px-3 py-1 text-sm text-white transition-opacity duration-400"
        classList={{ "opacity-0": !showZoomStatus() }}
      >
        Zoom: {(zoom() * 100).toFixed(0)}%
      </div>
    </>
  )
}
