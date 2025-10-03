import { Link } from "@solidjs/meta"
import { useSearchParams } from "@solidjs/router"
import { createEffect, createMemo, For } from "solid-js"
import { createStore } from "solid-js/store"
import Nav from "~/components/Nav"
import { useGraphsIndex } from "~/utils/graphs/useGraphsIndex"

type SortOption = {
  value: string
  label: string
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
    setSearchParams({ search: searchValue })
  }

  const [sortByRelevance, setSortByRelevance] = createStore<SortOption>({
    value: "relevance",
    label: "Relevance",
    disabled: search().trim() === "",
  })
  const [sortByLabelAsc] = createStore<SortOption>({
    value: "label-asc",
    label: "Label (A-Z)",
  })
  const [sortByLabelDesc] = createStore<SortOption>({
    value: "label-desc",
    label: "Label (Z-A)",
  })
  const [sortByNodesAsc] = createStore<SortOption>({
    value: "nodes-asc",
    label: "Fewest Nodes",
  })
  const [sortByNodesDesc] = createStore<SortOption>({
    value: "nodes-desc",
    label: "Most Nodes",
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
    // Activate "Sort by Relevance" when it becomes enabled
    if (!sortByRelevance.disabled) {
      setSearchParams({ sort: "relevance" })
    }
  })

  createEffect(() => {
    // Remove sort param if it's the first enabled option
    const firstEnabled = sortOptions.find((o) => !o.disabled)
    if (searchParams.sort === firstEnabled?.value) {
      setSearchParams({ sort: undefined }, { replace: true })
    }
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
        <For each={graphs()} fallback={<div>No graphs found</div>}>
          {(graph) => (
            <div>
              <h2>
                {graph.label} <small>({graph.id})</small>
              </h2>
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
