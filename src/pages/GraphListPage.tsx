import { Link } from "@solidjs/meta"
import { useSearchParams } from "@solidjs/router"
import { createMemo, For, Show } from "solid-js"
import Nav from "~/components/Nav"
import { useGraphsIndex } from "~/utils/graphs/useGraphsIndex"

export default function GraphListPage() {
  const graphs = useGraphsIndex()

  const SORT_OPTIONS = [
    { value: "relevance", label: "Relevance", requiresSearch: true },
    { value: "label-asc", label: "Label (A-Z)", requiresSearch: false },
    { value: "label-desc", label: "Label (Z-A)", requiresSearch: false },
  ]

  const [searchParams, setSearchParams] = useSearchParams()

  const getFirstParamValue = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v

  const search = createMemo(() => getFirstParamValue(searchParams.search) || "")
  const sort = createMemo(
    () =>
      getFirstParamValue(searchParams.sort) ||
      (searchParams.search ? "relevance" : "label-asc")
  )

  const normalizeSortParam = (sortValue: string, hasSearch: boolean) => {
    if (hasSearch) {
      return sortValue === "relevance" ? undefined : sortValue
    }
    return sortValue === "label-asc" ? undefined : sortValue
  }

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement
    const formData = new FormData(form)
    const searchValue = (formData.get("search") as string) || ""

    let newSort: string
    if (searchValue) {
      newSort = "relevance"
    } else if (sort() === "relevance") {
      newSort = "label-asc"
    } else {
      newSort = sort()
    }

    setSearchParams({
      search: searchValue,
      sort: normalizeSortParam(newSort, !!searchValue),
    })
  }

  const setSort = (value: string) => {
    setSearchParams({
      sort: normalizeSortParam(value, !!search()),
    })
  }

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
            <For each={SORT_OPTIONS}>
              {(option) => (
                <Show when={!option.requiresSearch || search()}>
                  <option
                    value={option.value}
                    selected={sort() === option.value}
                  >
                    {option.label}
                  </option>
                </Show>
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
