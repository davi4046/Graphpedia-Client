import { Link } from "@solidjs/meta"
import { useParams } from "@solidjs/router"
import { createEffect, createSignal, onCleanup } from "solid-js"
import CrosshairIcon from "~/icons/CrosshairIcon"
import ShareIcon from "~/icons/ShareIcon"
import WikidataMonogram from "~/icons/WikidataMonogram"
import ZoomInIcon from "~/icons/ZoomInIcon"
import ZoomOutIcon from "~/icons/ZoomOutIcon"
import Graph from "../components/Graph"
import { useGraphList } from "./useGraphList"

export default function GraphPage() {
  const params = useParams()
  const graphList = useGraphList()
  const graphInfo = () => graphList()?.find((g) => g.id === params.graphId)

  const zoomLevels = [0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2, 3, 4, 6, 8]

  const [posX, setPosX] = createSignal(0)
  const [posY, setPosY] = createSignal(0)
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

  const [shareModalOpen, setShareModalOpen] = createSignal(false)

  return (
    <>
      <Link rel="canonical" href={`/graph/${params.graphId}`} />
      <Graph
        graphId={params.graphId}
        posX={posX()}
        setPosX={setPosX}
        posY={posY()}
        setPosY={setPosY}
        zoom={zoom()}
        setZoom={setZoom}
      />
      <a
        href="/"
        title="Graphpedia home"
        aria-label="Graphpedia home"
        class="absolute top-0 left-0 flex flex-col items-center gap-0.5 bg-white shadow-sm"
      >
        <img src="/graphpedia.svg" alt="Graphpedia logo" class="h-14 w-14" />
        <img
          src="/graphpedia-wordmark.svg"
          alt="Graphpedia wordmark"
          class="h-auto w-14"
        />
      </a>
      <div
        role="banner"
        title={`${graphInfo()?.label} (${graphInfo()?.id})`}
        aria-describedby="graph-desc"
        data-tooltip={`${graphInfo()?.label} (${graphInfo()?.id}): ${graphInfo()?.description}`}
        data-placement="bottom"
        class="absolute top-0 left-1/2 -translate-x-1/2 border-x border-b border-gray-300 bg-white px-1 shadow-sm"
      >
        <h1 class="mb-0 text-lg font-semibold">
          {graphInfo()?.label} ({graphInfo()?.id})
        </h1>{" "}
        <div id="graph-desc" class="sr-only">
          {graphInfo()?.description}
        </div>
      </div>
      <div
        role="toolbar"
        class="pointer-events-none absolute right-2 bottom-2 flex flex-col gap-4"
      >
        <div class="flex flex-col gap-1">
          <button
            onClick={() => {
              setZoom(1)
              setPosX(0)
              setPosY(0)
            }}
            aria-label="Reset view"
            data-tooltip="Reset view"
            data-placement="left"
            class="pointer-events-auto grid h-7 w-7 place-items-center border-0 bg-black/80 p-0 [&>svg]:h-4.5 [&>svg]:w-4.5"
          >
            <CrosshairIcon />
          </button>
          <button
            onClick={() => setZoom(nextZoomIn())}
            aria-label="Zoom in"
            data-tooltip="Zoom in"
            data-placement="left"
            class="pointer-events-auto grid h-7 w-7 place-items-center border-0 bg-black/80 p-0 [&>svg]:h-4.5 [&>svg]:w-4.5"
          >
            <ZoomInIcon />
          </button>
          <button
            onClick={() => setZoom(nextZoomOut())}
            aria-label="Zoom out"
            data-tooltip="Zoom out"
            data-placement="left"
            class="pointer-events-auto grid h-7 w-7 place-items-center border-0 bg-black/80 p-0 [&>svg]:h-4.5 [&>svg]:w-4.5"
          >
            <ZoomOutIcon />
          </button>
        </div>
        <div class="flex flex-col gap-1">
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
          <button
            onClick={() => setShareModalOpen(true)}
            aria-label="Share this graph"
            data-tooltip="Share this graph"
            data-placement="left"
            class="pointer-events-auto grid h-7 w-7 place-items-center border-0 bg-black/80 p-0 [&>svg]:h-4.5 [&>svg]:w-4.5"
          >
            <ShareIcon />
          </button>
        </div>
      </div>
      <dialog
        open={shareModalOpen()}
        onClick={() => setShareModalOpen(false)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        aria-hidden={!shareModalOpen()}
      >
        <article onClick={(e) => e.stopPropagation()}>
          <header>
            <button
              aria-label="Close"
              // @ts-ignore
              rel="prev"
              onClick={() => setShareModalOpen(false)}
            ></button>
            <p id="share-title">
              <strong>Share graph</strong>
            </p>
          </header>
          <p>Blablablah blah blablah blah</p>
        </article>
      </dialog>
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
