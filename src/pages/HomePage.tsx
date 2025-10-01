import { Link } from "@solidjs/meta"
import { For } from "solid-js"
import Nav from "~/components/Nav"
import { useGraphsIndex } from "~/utils/graphs/useGraphsIndex"

export default function HomePage() {
  const graphs = useGraphsIndex()

  return (
    <>
      <Link rel="canonical" href="/" />
      <header>
        <Nav />
      </header>
      <main>
        <section id="welcome" class="hero-pattern bg-repeat py-16">
          <div class="flex flex-col items-center">
            <h1>Welcome to Graphpedia</h1>
            <p class="bg-white/50">
              home to more than 1600 visual knowledge graphs based on{" "}
              <a href="https://www.wikidata.org/">Wikidata</a> statements.
            </p>
            <a href="/graphs" role="button" class="outline">
              Browse Graphs
            </a>
          </div>
        </section>
        <section id="featured">
          <h2>Featured</h2>
        </section>
        <section id="graphs">
          <details open>
            <summary role="button">Graphs</summary>
            <ul class="flex flex-wrap justify-center gap-2">
              <For each={graphs()} fallback={<div>No graphs found</div>}>
                {(graph) => (
                  <li class="list-none before:mr-2 before:content-['•']">
                    <a href={`/graph/${graph.id}`}>{graph.label}</a>
                  </li>
                )}
              </For>
            </ul>
          </details>
        </section>
      </main>
      <footer>
        <div>Footer</div>
      </footer>
    </>
  )
}
