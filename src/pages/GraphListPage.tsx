import { Key } from "@solid-primitives/keyed"
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

  const [sortByRelevance, setSortByRelevance] = createStore<SortOption>({
    value: "relevance",
    label: "Relevance",
    disabled: true,
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

  createEffect(() => {
    setSortByRelevance("disabled", search().trim() === "")
  })

  createEffect(() => {
    if (!sortByRelevance.disabled) {
      setSort("relevance")
    }
  })

  const getFirstValue = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v

  const search = createMemo(() => getFirstValue(searchParams.search) || "")

  const sort = createMemo(() => {
    const firstParam = getFirstValue(searchParams.sort)
    const firstEnabled = sortOptions.find((o) => !o.disabled)

    if (firstParam) {
      const sortOption = sortOptions.find((o) => o.value === firstParam)
      return sortOption ? sortOption.value : firstEnabled?.value
    } else {
      return firstEnabled?.value
    }
  })

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement
    const formData = new FormData(form)
    const searchValue = (formData.get("search") as string) || ""
    setSearchParams({ search: searchValue })
  }

  const setSort = (value: string) => {
    setSearchParams({ sort: value })
  }

  createEffect(() => {
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
            value={sort()}
            onChange={(e) => setSort(e.target.value)}
          >
            <Key each={sortOptions} by={(option) => option.value}>
              {(option) => (
                <option value={option().value} disabled={option().disabled}>
                  {option().label}
                </option>
              )}
            </Key>
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
