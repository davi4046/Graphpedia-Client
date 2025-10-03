import { Link } from "@solidjs/meta"
import { useSearchParams } from "@solidjs/router"
import Fuse from "fuse.js"
import { createEffect, createMemo, For, Show } from "solid-js"
import { createStore } from "solid-js/store"
import Nav from "~/components/Nav"
import { useGraphsIndex } from "~/utils/graphs/useGraphsIndex"

type SortOption = {
  value: string
  label: string
  sortFn: (a: any, b: any) => number
  disabled?: boolean
}

export default function GraphListPage() {
  const graphs = useGraphsIndex()
  const [searchParams, setSearchParams] = useSearchParams()

  const getFirstValue = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v

  const search = createMemo(() => getFirstValue(searchParams.search) || "")

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement
    const formData = new FormData(form)
    const searchValue = (formData.get("search") as string) || ""
    if (searchValue === "") {
      setSearchParams({ search: searchValue })
    } else {
      setSearchParams({ search: searchValue, sort: "relevance" })
    }
  }

  const [sortByRelevance, setSortByRelevance] = createStore<SortOption>({
    value: "relevance",
    label: "Relevance",
    sortFn: () => 0,
    disabled: search().trim() === "",
  })
  const [sortByLabelAsc] = createStore<SortOption>({
    value: "label-asc",
    label: "Label (A-Z)",
    sortFn: (a, b) => a.label.localeCompare(b.label),
  })
  const [sortByLabelDesc] = createStore<SortOption>({
    value: "label-desc",
    label: "Label (Z-A)",
    sortFn: (a, b) => b.label.localeCompare(a.label),
  })
  const [sortByNodesAsc] = createStore<SortOption>({
    value: "nodes-asc",
    label: "Fewest Nodes",
    sortFn: (a, b) => a.numNodes - b.numNodes,
  })
  const [sortByNodesDesc] = createStore<SortOption>({
    value: "nodes-desc",
    label: "Most Nodes",
    sortFn: (a, b) => b.numNodes - a.numNodes,
  })

  const sortOptions: SortOption[] = [
    sortByRelevance,
    sortByLabelAsc,
    sortByLabelDesc,
    sortByNodesDesc,
    sortByNodesAsc,
  ]

  const sort = createMemo(() => {
    const firstParam = getFirstValue(searchParams.sort)
    const enabledOptions = sortOptions.filter((o) => !o.disabled)
    if (enabledOptions.length === 0) return null
    if (!firstParam) return enabledOptions[0]
    const sortOption = enabledOptions.find((o) => o.value === firstParam)
    return sortOption ? sortOption : enabledOptions[0]
  })

  createEffect(() => {
    // Disable "Sort by Relevance" if there's no search query
    setSortByRelevance("disabled", search().trim() === "")
  })

  createEffect(() => {
    // Remove sort param if it's the first enabled option
    const firstEnabled = sortOptions.find((o) => !o.disabled)
    if (searchParams.sort === firstEnabled?.value) {
      setSearchParams({ sort: undefined }, { replace: true })
    }
  })

  const searchResults = createMemo(() => {
    const data = graphs()
    const q = search()
    if (!data) return []
    if (!q) return data

    // Layer 1: id/label
    const layer1 = new Fuse(data, { keys: ["id", "label"], threshold: 0.3 })
      .search(q)
      .map((r) => r.item)

    // Layer 2: aliases
    const layer2 = new Fuse(data, { keys: ["aliases"], threshold: 0.3 })
      .search(q)
      .map((r) => r.item)
      .filter((item) => !layer1.includes(item)) // remove duplicates

    // Layer 3: description
    const layer3 = new Fuse(data, { keys: ["description"], threshold: 0.3 })
      .search(q)
      .map((r) => r.item)
      .filter((item) => !layer1.includes(item) && !layer2.includes(item))

    return [...layer1, ...layer2, ...layer3]
  })

  const sortedResults = createMemo(() => {
    const results = searchResults()
    const sortOption = sort()
    if (!sortOption) return results
    return [...results].sort(sortOption.sortFn)
  })

  return (
    <>
      <Link rel="canonical" href="/graphs" />
      <header>
        <Nav />
      </header>
      <main>
        <form action="/graphs" method="get" onSubmit={handleSubmit}>
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
            value={sort()?.value}
            onChange={(e) => setSearchParams({ sort: e.target.value })}
          >
            <For each={sortOptions}>
              {(option) => (
                <option
                  value={option.value}
                  disabled={option.disabled}
                  selected={sort() === option}
                >
                  {option.label}
                </option>
              )}
            </For>
          </select>
        </form>
        <Show when={sortedResults()} keyed={true}>
          <For each={sortedResults()} fallback={<div>No graphs found</div>}>
            {(graph) => (
              <div>
                <h2>
                  {graph.label} <small>({graph.id})</small>
                </h2>
                <p>{graph.description}</p>
              </div>
            )}
          </For>
        </Show>
      </main>
      <footer>
        <div>Footer</div>
      </footer>
    </>
  )
}
