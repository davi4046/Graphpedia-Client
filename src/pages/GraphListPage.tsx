import { Link } from "@solidjs/meta"
import { For } from "solid-js"
import Nav from "~/components/Nav"
import { useGraphsIndex } from "~/utils/graphs/useGraphsIndex"

export default function GraphListPage() {
  const graphs = useGraphsIndex()

  return (
    <>
      <Link rel="canonical" href="/graphs" />
      <header>
        <Nav />
      </header>
      <main>
        <form
          action="/graphs"
          method="get"
          onSubmit={(e) => {
            e.preventDefault()
            console.log("submit", e)
          }}
        >
          <div role="group">
            <input type="search" name="search" placeholder="Search" />
            <input type="submit" value="Search" />
          </div>
          <label for="sort">Sort by:</label>
          <select name="sort" id="sort">
            <option value="label_asc">Label (A-z)</option>
            <option value="label_desc">Label (Z-a)</option>
            <option value="nodes_desc">Most Nodes</option>
            <option value="nodes_asc">Fewest Nodes</option>
            <option value="edges_desc">Most Edges</option>
            <option value="edges_asc">Fewest Edges</option>
            <option value="density_desc">Highest Density</option>
            <option value="density_asc">Lowest Density</option>
          </select>
        </form>
        <For each={graphs()} fallback={<div>No graphs found</div>}>
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
