import { Link, Title } from "@solidjs/meta"
import { useParams, useSearchParams } from "@solidjs/router"
import { createEffect } from "solid-js"
import { GRAPH_DATA_URL } from "~/config"
import {
  GraphDataAdapter,
  GraphDataSource,
  GraphEngine,
  GraphNodeLocator,
  useGraphList,
} from "~/graph"
import useGraphView from "~/hooks/useGraphView"
import useRestoreViewport from "~/hooks/useRestoreViewport"
import useSignalPulse from "~/hooks/useSignalPulse"
import useZoomLevels from "~/hooks/useZoomLevels"
import CrosshairIcon from "~/icons/CrosshairIcon"
import WikidataMonogram from "~/icons/WikidataMonogram"
import ZoomInIcon from "~/icons/ZoomInIcon"
import ZoomOutIcon from "~/icons/ZoomOutIcon"

export default function GraphPage() {
  const params = useParams()
  const [searchParams] = useSearchParams()

  const nodeId = searchParams.item
    ? Number(searchParams.item.slice(1))
    : undefined

  const graphList = useGraphList()
  const graphInfo = () => graphList()?.find((g) => g.id === params.graphId)

  let container: HTMLDivElement | undefined
  const { graphView, zoom } = useGraphView(() => container)
  const { restoreViewport } = useRestoreViewport(graphView, params.graphId)

  let nodePosition: { x: number; y: number } | null = null

  const focusViewport = (position: { x: number; y: number }) => {
    const view = graphView()
    if (view) view.setViewportCenter(position.x, position.y, 2)
  }

  const resetViewport = () => {
    const view = graphView()
    if (view) view.setViewportCorner(0, 0, 1)
  }

  createEffect(async () => {
    const view = graphView()
    if (!view) return

    const dataSource = await GraphDataSource.create(
      GRAPH_DATA_URL,
      params.graphId
    )

    const dataAdapter = new GraphDataAdapter(dataSource)
    const graphTiles = await dataAdapter.tiles()
    const graphEngine = new GraphEngine(view, graphTiles)

    if (nodeId) {
      const nodeLocator = await GraphNodeLocator.create(dataSource)
      nodePosition = await nodeLocator.locateNode(nodeId)
    }

    if (nodePosition) {
      focusViewport(nodePosition)
    } else {
      restoreViewport()
    }
  })

  const zoomLevels = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4]
  const { nextZoomIn, nextZoomOut } = useZoomLevels(zoom, zoomLevels)

  const showZoomStatus = useSignalPulse(zoom, 1200)

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
          onClick={() => {
            if (nodePosition) {
              focusViewport(nodePosition)
            } else {
              resetViewport()
            }
          }}
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
