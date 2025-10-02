import { Link } from "@solidjs/meta"
import { useSearchParams } from "@solidjs/router"
import { createEffect, createSignal, For } from "solid-js"
import Nav from "~/components/Nav"
import { useGraphsIndex } from "~/utils/graphs/useGraphsIndex"

export default function GraphListPage() {
  const graphs = useGraphsIndex()
  const [searchParams, setSearchParams] = useSearchParams()

  const DEFAULTS = {
    search: "",
    sort: "label-asc",
    page: "1",
    pageSize: "20",
  }

  const SORT_OPTIONS = [
    { value: "label-asc", label: "Label (A-z)" },
    { value: "label-desc", label: "Label (Z-a)" },
    { value: "nodes-desc", label: "Most Nodes" },
    { value: "nodes-asc", label: "Fewest Nodes" },
    { value: "edges-desc", label: "Most Edges" },
    { value: "edges-asc", label: "Fewest Edges" },
    { value: "density-desc", label: "Highest Density" },
    { value: "density-asc", label: "Lowest Density" },
  ]

  const getFirst = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v

  const [search, setSearch] = createSignal(
    getFirst(searchParams.search) ?? DEFAULTS.search
  )
  const [sort, setSort] = createSignal(
    getFirst(searchParams.sort) ?? DEFAULTS.sort
  )
  const [page, setPage] = createSignal(
    getFirst(searchParams.page) ?? DEFAULTS.page
  )
  const [pageSize, setPageSize] = createSignal(
    getFirst(searchParams.pageSize) ?? DEFAULTS.pageSize
  )

  createEffect(() => {
    setSearchParams({
      search: search() !== DEFAULTS.search ? search() : undefined,
      sort: sort() !== DEFAULTS.sort ? sort() : undefined,
      page: page() !== DEFAULTS.page ? page() : undefined,
      pageSize: pageSize() !== DEFAULTS.pageSize ? pageSize() : undefined,
    })
  })

  createEffect(() => {
    setSearch(getFirst(searchParams.search) ?? DEFAULTS.search)
    setSort(getFirst(searchParams.sort) ?? DEFAULTS.sort)
    setPage(getFirst(searchParams.page) ?? DEFAULTS.page)
    setPageSize(getFirst(searchParams.pageSize) ?? DEFAULTS.pageSize)
  })

  const handleFormSubmit = (e: Event) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const searchValue = formData.get("search")?.toString() ?? ""
    setSearch(searchValue)
  }

  const sortedGraphs = () => {
    const arr = [...(graphs() ?? [])]
    switch (sort()) {
      case "label-asc":
        arr.sort((a, b) => a.label.localeCompare(b.label))
        break
      case "label-desc":
        arr.sort((a, b) => b.label.localeCompare(a.label))
        break
      case "nodes-asc":
        arr.sort((a, b) => a.numNodes - b.numEdges)
        break
      case "nodes-desc":
        arr.sort((a, b) => b.numNodes - a.numNodes)
        break
      case "edges-asc":
        arr.sort((a, b) => a.numEdges - b.numEdges)
        break
      case "edges-desc":
        arr.sort((a, b) => b.numEdges - a.numEdges)
        break
      case "density-asc":
        arr.sort((a, b) => a.numNodes / a.numEdges - b.numNodes / b.numEdges)
        break
      case "density-desc":
        arr.sort((a, b) => b.numNodes / b.numEdges - a.numNodes / a.numEdges)
        break
      default:
        break
    }
    return arr
  }

  return (
    <>
      <Link rel="canonical" href="/graphs" />
      <header>
        <Nav />
      </header>
      <main>
        <form action="/graphs" method="get" onSubmit={handleFormSubmit}>
          <div role="group">
            <input
              type="search"
              name="search"
              placeholder="Search"
              value={search()}
            />
            <input type="submit" value="Search" />
          </div>
          <label for="sort">Sort by:</label>
          <select
            name="sort"
            id="sort"
            value={sort()}
            onChange={(e) => setSort(e.currentTarget.value)}
          >
            <For each={SORT_OPTIONS}>
              {(option) => (
                <option value={option.value} selected={sort() === option.value}>
                  {option.label}
                </option>
              )}
            </For>
          </select>
        </form>
        <For each={sortedGraphs()} fallback={<div>No graphs found</div>}>
          {(graph) => (
            <div>
              <h2>{graph.label}</h2>
              <p>{graph.description}</p>
            </div>
          )}
        </For>
      </main>
      <footer>
        <div>Footer</div>
      </footer>
    </>
  )
}
