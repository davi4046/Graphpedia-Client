import { Link } from "@solidjs/meta"
import { useSearchParams } from "@solidjs/router"
import { For } from "solid-js"
import Nav from "~/components/Nav"
import { useGraphsIndex } from "~/utils/graphs/useGraphsIndex"

export default function GraphListPage() {
  const graphsIndex = useGraphsIndex()

  const [searchParams, setSearchParams] = useSearchParams()

  return (
    <>
      <Link rel="canonical" href="/graphs" />
      <header>
        <Nav />
      </header>
      <main>
        <form>
          <div role="group">
            <input type="search" name="search" placeholder="Search" />
            <input type="submit" value="Search" />
          </div>
        </form>
        <label>Sort by:</label>
        <select name="sort" id="sort">
          <option value="label-asc">Label (A-z)</option>
          <option value="label-desc">Label (Z-a)</option>
          <option value="nodes-desc">Most Nodes</option>
          <option value="nodes-asc">Fewest Nodes</option>
          <option value="edges-desc">Most Edges</option>
          <option value="edges-asc">Fewest Edges</option>
          <option value="density-desc">Highest Density</option>
          <option value="density-asc">Lowest Density</option>
        </select>
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
