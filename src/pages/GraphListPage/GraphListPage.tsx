import { Link } from "@solidjs/meta"
import { useSearchParams } from "@solidjs/router"
import { createEffect, createSignal, For, onMount } from "solid-js"
import Nav from "~/components/Nav"
import { useGraphsIndex } from "~/utils/graphs/useGraphsIndex"
import MultiSelect from "./MultiSelect"
import Select from "./Select"

export default function GraphListPage() {
  const graphsIndex = useGraphsIndex()

  const fieldOptions: [string, string][] = [
    ["Label", "label"],
    ["Description", "description"],
    ["Aliases", "aliases"],
    ["Tags", "tags"],
  ]

  const orderOptions: [string, string][] = [
    ["Label (A-z)", "label-asc"],
    ["Label (Z-a)", "label-desc"],
    ["Most Nodes", "nodes-desc"],
    ["Fewest Nodes", "nodes-asc"],
    ["Most Edges", "edges-desc"],
    ["Fewest Edges", "edges-asc"],
    ["Highest Density", "density-desc"],
    ["Lowest Density", "density-asc"],
  ]

  const [query, setQuery] = createSignal("")
  const [selectedFields, setSelectedFields] = createSignal(
    fieldOptions.map((p) => p[1])
  )
  const [selectedOrder, setSelectedOrder] = createSignal(orderOptions[0][1])

  const [searchParams, setSearchParams] = useSearchParams()

  onMount(() => {
    if (typeof searchParams.search === "string") {
      setQuery(searchParams.search)
    }
    if (typeof searchParams.searchBy === "string") {
      const fields = searchParams.searchBy.split(",")
      setSelectedFields(fields)
    }
    if (typeof searchParams.orderBy === "string") {
      setSelectedOrder(searchParams.orderBy)
    }
  })

  createEffect(() => {
    setSearchParams({
      search: query(),
      searchBy: selectedFields().join(","),
      orderBy: selectedOrder(),
    })
  })

  return (
    <>
      <Link rel="canonical" href="/graphs" />
      <header>
        <Nav />
      </header>
      <main>
        <input
          type="search"
          name="search"
          placeholder="Search"
          value={query()}
          onInput={(e) => setQuery(e.currentTarget.value)}
        />
        <label>Search by:</label>
        <MultiSelect
          name="searchable-fields"
          options={fieldOptions}
          selected={[selectedFields, setSelectedFields]}
        />
        <label>Order by:</label>
        <Select
          name="order"
          ariaLabel="Order by"
          options={orderOptions}
          selected={[selectedOrder, setSelectedOrder]}
        />
        <For each={graphsIndex()} fallback={<div>No graphs found</div>}>
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
