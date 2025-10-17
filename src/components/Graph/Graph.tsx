import {
  createEffect,
  createSignal,
  onCleanup,
  onMount,
  Setter,
} from "solid-js"
import { GRAPH_DATA_URL } from "~/config"
import { GraphAdapter } from "./dataAdapter"
import { GraphpediaDataSource } from "./dataSource"
import { GraphTile } from "./GraphEngine/types"
import { useGraphEngine } from "./useGraphEngine"

type GraphProps = {
  graphId: string
  posX: number
  posY: number
  zoom: number
  setPosX: Setter<number>
  setPosY: Setter<number>
  setZoom: Setter<number>
}

export default function Graph(props: GraphProps) {
  let containerRef: HTMLDivElement | undefined
  const [tiles, setTiles] = createSignal<GraphTile[]>()

  onMount(async () => {
    const dataSource = new GraphpediaDataSource(GRAPH_DATA_URL, props.graphId)
    const graph = new GraphAdapter(dataSource)
    const result = await graph.tiles()
    setTiles(result)
  })

  const { graphView } = useGraphEngine(() => containerRef, tiles)

  createEffect(() => {
    const view = graphView()
    if (!view) return
    view.setZoom(props.zoom)
  })

  createEffect(() => {
    const view = graphView()
    if (!view) return
    view.setPosition(props.posX, props.posY)
  })

  createEffect(() => {
    const view = graphView()
    if (!view) return

    const movedHandler = () => {
      const { x, y } = view.getPosition()
      props.setPosX(x)
      props.setPosY(y)
    }
    view.onViewportMoved(movedHandler)

    const zoomedHandler = () => props.setZoom(view.getZoom())
    view.onViewportZoomedEnd(zoomedHandler)

    onCleanup(() => {
      view.offViewportMoved(movedHandler)
      view.offViewportZoomedEnd(zoomedHandler)
    })
  })

  return <div ref={containerRef} class="h-[100vh] w-[100vw]" />
}
