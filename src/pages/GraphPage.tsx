import { Link, Meta, Title } from "@solidjs/meta"
import { useSearchParams } from "@solidjs/router"
import { createEffect } from "solid-js"
import {
  GraphDataAdapter,
  GraphDataSource,
  GraphEngine,
  GraphNodeLocator,
} from "~/graph"
import { GraphEntry } from "~/graph/graphsIndex"
import useGraphView from "~/hooks/useGraphView"
import useRestoreViewport from "~/hooks/useRestoreViewport"
import useSignalPulse from "~/hooks/useSignalPulse"
import useZoomLevels from "~/hooks/useZoomLevels"
import CrosshairIcon from "~/icons/CrosshairIcon"
import WikidataMonogram from "~/icons/WikidataMonogram"
import ZoomInIcon from "~/icons/ZoomInIcon"
import ZoomOutIcon from "~/icons/ZoomOutIcon"

type GraphPageProps = {
  graph: GraphEntry
}

export default function GraphPage(props: GraphPageProps) {
  const [searchParams] = useSearchParams()

  let container: HTMLDivElement | undefined
  const { graphView, zoom } = useGraphView(() => container)
  const { restoreViewport } = useRestoreViewport(graphView, props.graph.id)

  const focusViewport = (position: { x: number; y: number }) => {
    const view = graphView()
    if (view) view.setViewportCenter(position.x, position.y, 2)
  }

  const resetViewport = () => {
    const view = graphView()
    if (view) view.setViewportCorner(0, 0, 1)
  }

  const zoomLevels = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4]
  const { nextZoomIn, nextZoomOut } = useZoomLevels(zoom, zoomLevels)
  const showZoomStatus = useSignalPulse(zoom, 1200)

  let targetPosition: { x: number; y: number } | null = null

  let zoomReady = false

  createEffect(async () => {
    const view = graphView()
    if (!view) return

    const dataSource = await GraphDataSource.create(props.graph.id)
    const dataAdapter = new GraphDataAdapter(dataSource)
    const graphTiles = await dataAdapter.tiles()
    const graphEngine = new GraphEngine(view, graphTiles)

    const nodeId = searchParams.item
      ? Number(searchParams.item.slice(1))
      : undefined

    if (nodeId) {
      const nodeLocator = await GraphNodeLocator.create(dataSource)
      targetPosition = await nodeLocator.locateNode(nodeId)
    }

    if (targetPosition) {
      focusViewport(targetPosition)
    } else {
      restoreViewport()
    }

    zoomReady = true
  })

  // TODO: include queried item in meta description
  // TODO: og:image

  return (
    <>
      <Title>{`${props.graph.label} - Graphpedia`}</Title>
      <Meta name="title" content={props.graph.label} />
      <Meta
        name="description"
        content={`Wikidata property ${props.graph.id} '${props.graph.label}' (${props.graph.description}), also known as ${props.graph.aliases.join(", ")}.`}
      />
      <Link rel="canonical" href={`/graph/${props.graph.id}`} />
      <Meta property="og:type" content="website" />
      <Meta property="og:url" content={props.graph.url} />
      <Meta property="og:title" content={props.graph.label} />
      <Meta
        property="og:description"
        content={`Wikidata property ${props.graph.id} '${props.graph.label}' (${props.graph.description}), also known as ${props.graph.aliases.join(", ")}.`}
      />
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
        class="absolute top-0 left-0 bg-white shadow-sm"
      >
        <img src="/graphpedia.svg" alt="" class="h-14 w-14" />
        <img src="/graphpedia-wordmark-light.svg" alt="" class="mt-0.5 w-14" />
      </a>
      <div
        data-tooltip={props.graph.description}
        data-placement="bottom"
        class="absolute top-0 left-1/2 -translate-x-1/2 border-x border-b border-gray-300 bg-white shadow-sm"
      >
        <h1
          id="graph-title"
          data-template="title-tooltip"
          class="mb-0 px-1 text-lg font-semibold"
        >
          {props.graph.label}
        </h1>
        <div id="graph-desc" class="sr-only">
          {props.graph.description}
        </div>
      </div>
      <div
        role="toolbar"
        class="pointer-events-none absolute right-2 bottom-2 flex flex-col gap-1"
      >
        <button
          onClick={() => {
            if (targetPosition) {
              focusViewport(targetPosition)
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
          href={props.graph.wikidataUrl}
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
        classList={{ "opacity-0": !showZoomStatus() || !zoomReady }}
        class="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 rounded-lg bg-black/60 px-3 py-1 text-sm text-white transition-opacity duration-400"
      >
        Zoom: {(zoom() * 100).toFixed(0)}%
      </div>
    </>
  )
}
