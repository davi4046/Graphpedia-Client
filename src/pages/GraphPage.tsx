import { Link, Meta, Style, Title } from "@solidjs/meta"
import { createAsync, query, useSearchParams } from "@solidjs/router"
import { createEffect, createMemo } from "solid-js"
import {
  GraphDataAdapter,
  GraphDataSource,
  GraphEngine,
  GraphNodeLocator,
} from "~/graph"
import { GraphEntry } from "~/graph/graphsIndex"
import { fetchItems } from "~/graph/wikidataAPI"
import useGraphView from "~/hooks/useGraphView"
import useIsFramed from "~/hooks/useIsFramed"
import useRestoreViewport from "~/hooks/useRestoreViewport"
import useSignalPulse from "~/hooks/useSignalPulse"
import useZoomLevels from "~/hooks/useZoomLevels"
import ArrowSquareOut from "~/icons/ArrowSquareOut"
import CrosshairIcon from "~/icons/CrosshairIcon"
import WikidataMonogram from "~/icons/WikidataMonogram"
import ZoomInIcon from "~/icons/ZoomInIcon"
import ZoomOutIcon from "~/icons/ZoomOutIcon"

const tempInset = 150 // Temporary inset to show more nodes on initial load

const getItemLabel = query(async (itemId: string) => {
  try {
    const items = await fetchItems([itemId])
    return items?.[0]?.labels?.en?.value
  } catch (error) {
    console.error("Error fetching item label:", error)
  }
}, "itemLabel")

type GraphPageProps = {
  graph: GraphEntry
}

export default function GraphPage(props: GraphPageProps) {
  const isFramed = useIsFramed()
  const [searchParams] = useSearchParams()

  const queryItemId = createMemo(() => {
    const item = searchParams.item
    if (!item) return undefined
    return Array.isArray(item) ? item[0] : item
  })

  const queryItemLabel = createAsync(
    async () => {
      const id = queryItemId()
      if (!id) return undefined
      return getItemLabel(id)
    },
    { deferStream: true }
  )

  let container: HTMLDivElement | undefined
  const { graphView, zoom } = useGraphView(() => container)
  const { restoreViewport } = useRestoreViewport(graphView, props.graph.id)

  const focusViewport = (position: { x: number; y: number; zoom: number }) => {
    const view = graphView()
    if (view) view.setViewportCenter(position.x, position.y, position.zoom)
  }

  const zoomLevels = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4]
  const { nextZoomIn, nextZoomOut } = useZoomLevels(zoom, zoomLevels)
  const showZoomStatus = useSignalPulse(zoom, 1200)

  let targetViewport: { x: number; y: number; zoom: number } | null = null
  let zoomReady = false

  createEffect(async () => {
    const view = graphView()
    if (!view) return

    const dataSource = await GraphDataSource.create(props.graph.id)
    const dataAdapter = new GraphDataAdapter(dataSource)
    const graphTiles = await dataAdapter.tiles()
    const graphEngine = new GraphEngine(view, graphTiles)

    const getDefaultViewport = async () => {
      const { nodes } = await graphTiles[0].getContent()
      const arbitraryNode = nodes.length > 0 ? nodes[0] : null

      if (arbitraryNode) {
        return { x: arbitraryNode.x, y: arbitraryNode.y, zoom: 0.5 }
      }
      return { x: 0, y: 0, zoom: 1 }
    }

    const itemId = queryItemId()
    if (itemId !== undefined) {
      const nodeId = Number(itemId.slice(1))
      const nodeLocator = await GraphNodeLocator.create(dataSource)
      const position = await nodeLocator.locateNode(nodeId)
      if (position) {
        targetViewport = { x: position.x, y: position.y, zoom: 2 }
      }
    }

    if (targetViewport) {
      focusViewport(targetViewport)
    } else {
      const restored = restoreViewport()
      if (!restored) {
        targetViewport = await getDefaultViewport()
        focusViewport(targetViewport)
      }
    }

    zoomReady = true
  })

  return (
    <>
      <Title>{`${props.graph.label} - Graphpedia`}</Title>
      <Meta name="title" content={props.graph.label} />
      <Meta
        name="description"
        content={`Wikidata property ${props.graph.id} \u2018${props.graph.label}\u2019 (${props.graph.description}), also known as ${props.graph.aliases.join(", ")}.`}
      />
      <Link rel="canonical" href={`/graph/${props.graph.id}`} />
      <Meta property="og:type" content="website" />
      <Meta property="og:url" content={props.graph.url} />
      <Meta
        property="og:title"
        data-sm=""
        content={
          queryItemLabel()
            ? `${queryItemLabel()} | ${props.graph.label}`
            : props.graph.label
        }
      />
      <Meta
        property="og:description"
        content={`Wikidata property ${props.graph.id} \u2018${props.graph.label}\u2019 (${props.graph.description}), also known as ${props.graph.aliases.join(", ")}.`}
      />
      <Style>
        {`
          body {
            overflow: hidden;
          }
        `}
      </Style>
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
          onClick={() => {
            if (targetViewport) {
              focusViewport(targetViewport)
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
