import { createPagination } from "@solid-primitives/pagination"
import { Link, Title } from "@solidjs/meta"
import { useLocation, useSearchParams } from "@solidjs/router"
import Fuse from "fuse.js"
import { createEffect, createMemo, For } from "solid-js"
import { createStore } from "solid-js/store"
import Footer from "~/components/Footer"
import Header from "~/components/Header"
import useGraphList from "~/hooks/useGraphList"

type SortOption = {
  value: string
  label: string
  sortFn: (a: any, b: any) => number
  disabled?: boolean
}

export default function GraphListPage() {
  const graphList = useGraphList()
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
      setSearchParams({ search: searchValue, page: undefined })
    } else {
      setSearchParams({
        search: searchValue,
        page: undefined,
        sort: "relevance",
      })
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
  const [sortByEdgesAsc] = createStore<SortOption>({
    value: "edges-asc",
    label: "Fewest Edges",
    sortFn: (a, b) => a.numEdges - b.numEdges,
  })
  const [sortByEdgesDesc] = createStore<SortOption>({
    value: "edges-desc",
    label: "Most Edges",
    sortFn: (a, b) => b.numEdges - a.numEdges,
  })
  const [sortByAvgDegreeAsc] = createStore<SortOption>({
    value: "avg-degree-asc",
    label: "Lowest Average Degree",
    sortFn: (a, b) => a.numEdges / a.numNodes - b.numEdges / b.numNodes,
  })
  const [sortByAvgDegreeDesc] = createStore<SortOption>({
    value: "avg-degree-desc",
    label: "Highest Average Degree",
    sortFn: (a, b) => b.numEdges / b.numNodes - a.numEdges / a.numNodes,
  })

  const sortOptions: SortOption[] = [
    sortByRelevance,
    sortByLabelAsc,
    sortByLabelDesc,
    sortByNodesDesc,
    sortByNodesAsc,
    sortByEdgesDesc,
    sortByEdgesAsc,
    sortByAvgDegreeDesc,
    sortByAvgDegreeAsc,
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
    const data = graphList()
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

  const resultsPerPage = 25

  const pageNum = createMemo(() => {
    return parseInt(getFirstValue(searchParams.page) || "1")
  })

  const [paginationProps, page, setPage] = createPagination(() => ({
    pages: Math.ceil(sortedResults().length / resultsPerPage),
    initialPage: pageNum(),
  }))

  const paginatedResults = createMemo(() => {
    const results = sortedResults()
    const start = (page() - 1) * resultsPerPage
    return results.slice(start, start + resultsPerPage)
  })

  createEffect(() => {
    setPage(pageNum())
  })

  const location = useLocation()

  const pageUrl = (page?: number) => {
    const params = new URLSearchParams(location.search)
    if (page !== undefined) params.set("page", String(page))
    else params.delete("page")
    const newQuery = params.toString()
    return newQuery ? `?${newQuery}` : ""
  }

  return (
    <>
      {search() ? (
        <Title>Search results for "{search()}" - Graphpedia</Title>
      ) : (
        <Title>All Graphs - Graphpedia</Title>
      )}
      <Link rel="canonical" href="/graphs" />
      <Header />
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
          <select
            name="sort"
            aria-label="Sort results by"
            value={sort()?.value}
            onChange={(e) =>
              setSearchParams({ sort: e.target.value, page: undefined })
            }
          >
            <For each={sortOptions}>
              {(option) => (
                <option
                  value={option.value}
                  disabled={option.disabled}
                  selected={sort() === option}
                >
                  {sort() === option
                    ? `Sort by: ${option.label}`
                    : option.label}
                </option>
              )}
            </For>
          </select>
        </form>
        <section aria-label="Search Results">
          <header class="flex justify-between">
            <nav aria-label="Top pagination for search results">
              <ul>
                <For each={paginationProps()}>
                  {(props) => (
                    <li>
                      <a
                        href={pageUrl(props.page)}
                        aria-current={props["aria-current"]}
                        classList={{
                          "bg-gray-300": props["aria-current"],
                          "hover:bg-gray-200": !props["aria-current"],
                          "active:bg-gray-200": !props["aria-current"],
                        }}
                        class="flex h-10 w-10 justify-center whitespace-nowrap"
                      >
                        {props.children}
                      </a>
                    </li>
                  )}
                </For>
              </ul>
            </nav>
            <p class="font-semibold">
              {page() * resultsPerPage - (resultsPerPage - 1)} &ndash;{" "}
              {Math.min(page() * resultsPerPage, sortedResults().length)} of{" "}
              {sortedResults().length}
            </p>
          </header>
          <ul>
            <For
              each={paginatedResults()}
              fallback={<div>No graphs found</div>}
            >
              {(graph) => (
                <li class="m-0 list-none">
                  <a
                    href={`/graph/${graph.id}`}
                    class="group flex w-full flex-col py-2 no-underline hover:bg-gray-200"
                  >
                    <strong class="group-visited:text-visited group-visited:decoration-visited font-semibold group-hover:underline">
                      {graph.label} ({graph.id})
                    </strong>
                    <small class="text-gray-600">{graph.description}</small>
                  </a>
                </li>
              )}
            </For>
          </ul>
        </section>
        <nav aria-label="Bottom pagination for search results">
          <ul>
            <For each={paginationProps()}>
              {(props) => (
                <li>
                  <a
                    href={pageUrl(props.page)}
                    aria-current={props["aria-current"]}
                    classList={{
                      "bg-gray-300": props["aria-current"],
                      "hover:bg-gray-200": !props["aria-current"],
                      "active:bg-gray-200": !props["aria-current"],
                    }}
                    class="flex h-10 w-10 justify-center whitespace-nowrap"
                  >
                    {props.children}
                  </a>
                </li>
              )}
            </For>
          </ul>
        </nav>
      </main>
      <Footer />
    </>
  )
}
