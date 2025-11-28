import { Link, Meta, Title } from "@solidjs/meta"
import { createEffect } from "solid-js"
import { GraphEntry } from "~/graph/graphsIndex"
import useDataSource from "~/hooks/useDataSource"
import useGraphEngine from "~/hooks/useGraphEngine"
import useGraphView from "~/hooks/useGraphView"
import useInitialCenter from "~/hooks/useInitialCenter"
import useIsFramed from "~/hooks/useIsFramed"
import useItemLabel from "~/hooks/useItemLabel"
import useNodePosition from "~/hooks/useNodePosition"
import useSearchParam from "~/hooks/useSearchParam"
import useSignalPulse from "~/hooks/useSignalPulse"
import useTippy from "~/hooks/useTippy"
import useViewportSave from "~/hooks/useViewportSave"
import useZoomLevels from "~/hooks/useZoomLevels"
import ArrowSquareOut from "~/icons/ArrowSquareOut"
import CrosshairIcon from "~/icons/CrosshairIcon"
import WikidataMonogram from "~/icons/WikidataMonogram"
import ZoomInIcon from "~/icons/ZoomInIcon"
import ZoomOutIcon from "~/icons/ZoomOutIcon"

type GraphPageProps = {
  graph: GraphEntry
}

export default function GraphPage(props: GraphPageProps) {
  const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4] as const

  let container: HTMLDivElement | undefined

  const { graphView, zoom } = useGraphView(() => container)
  const { nextZoomIn, nextZoomOut } = useZoomLevels(zoom, ZOOM_LEVELS)
  const showZoomStatus = useSignalPulse(zoom, 1200)
  const viewportSave = useViewportSave(graphView, props.graph.id)
  const dataSource = useDataSource(props.graph.id)
  const graphEngine = useGraphEngine(graphView, dataSource)
  const targetItemId = useSearchParam("item")
  const targetItemLabel = useItemLabel(targetItemId)
  const targetPosition = useNodePosition(dataSource, targetItemId)
  const centerPosition = useInitialCenter(dataSource)

  const resetViewport = () => {
    const view = graphView()
    if (!view) return

    const targetPos = targetPosition()
    const centerPos = centerPosition()

    if (targetPos) {
      view.setViewportCenter(targetPos.x, targetPos.y, 2)
    } else if (centerPos) {
      view.setViewportCenter(centerPos.x, centerPos.y, 1)
    }
  }

  let zoomReady = false

  createEffect(() => {
    const view = graphView()
    if (!view) return

    const targetPos = targetPosition()
    const savedView = viewportSave()
    const centerPos = centerPosition()

    if (targetPos) {
      view.setViewportCenter(targetPos.x, targetPos.y, 2)
    } else if (savedView) {
      view.setViewportCenter(savedView.x, savedView.y, savedView.zoom)
    } else if (centerPos) {
      view.setViewportCenter(centerPos.x, centerPos.y, 1)
    }

    zoomReady = true
  })

  const metaTitle = () => {
    if (targetItemLabel()) {
      return `${targetItemLabel()} | ${props.graph.label}`
    }
    return props.graph.label
  }

  const metaDescription = () => {
    return `Wikidata property ${props.graph.id} \u2018${props.graph.label}\u2019 (${props.graph.description}), also known as ${props.graph.aliases.join(", ")}.`
  }

  const isFramed = useIsFramed()

  useTippy({
    targets: "#graph-title",
    options: {
      content: props.graph.description,
      placement: "bottom",
      maxWidth: "none",
      trigger: "mouseenter click",
    },
  })

  return (
    <>
      <Title>{`${props.graph.label} - Graphpedia`}</Title>
      <Link rel="canonical" href={props.graph.url} />
      <Meta name="title" content={metaTitle()} />
      <Meta name="description" content={metaDescription()} />
      <Meta property="og:type" content="website" />
      <Meta property="og:url" content={props.graph.url} />
      <Meta property="og:title" content={metaTitle()} />
      <Meta property="og:description" content={metaDescription()} />
      <style>
        {`
          body {
            overflow: hidden;
          }
        `}
      </style>
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
        target="_top"
        aria-label="Graphpedia"
        class="absolute top-0 left-0 bg-white shadow-sm"
      >
        <img src="/graphpedia.svg" alt="" class="h-14 w-14" />
        <img src="/graphpedia-wordmark-light.svg" alt="" class="mt-0.5 w-14" />
      </a>
      <div class="absolute top-0 left-1/2 -translate-x-1/2 border-x border-b border-gray-300 bg-white shadow-sm select-none">
        <h1 id="graph-title" class="mb-0 px-1 text-lg font-semibold">
          {props.graph.label}
        </h1>
        <div id="graph-desc" class="sr-only">
          {props.graph.description}
        </div>
      </div>
      {isFramed() && (
        <div class="pointer-events-none absolute top-2 right-2">
          <a
            href={props.graph.url}
            target="_blank"
            rel="noopener noreferrer"
            role="button"
            aria-label="Go to graph page"
            data-tooltip="Go to graph page"
            data-placement="left"
            class="pointer-events-auto grid h-7 w-7 place-items-center border-0 bg-[var(--pico-primary)] p-0 [&>svg]:h-4.5 [&>svg]:w-4.5"
          >
            <ArrowSquareOut />
          </a>
        </div>
      )}
      <div
        role="toolbar"
        class="pointer-events-none absolute right-2 bottom-2 flex flex-col gap-1"
      >
        <button
          onClick={() => resetViewport()}
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
      {props.graph.workInProgress && (
        <div class="pointer-events-none absolute bottom-2 left-2 rounded-full bg-yellow-200/80 px-2 py-1 text-yellow-800">
          Work in Progress 🚧
        </div>
      )}
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
