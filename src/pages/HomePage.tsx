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
            <p>
              home to more than 1600 visual knowledge graphs based on{" "}
              <a href="https://www.wikidata.org/">Wikidata</a> statements.
            </p>
            <a href="/graphs" role="button" class="outline">
              Browse Graphs A&ndash;Z
            </a>
          </div>
        </section>
        <section id="featured">
          <h2>Featured Graph</h2>
          <div class="h-64 bg-green-300"></div>
        </section>
        <section id="graphs">
          <details open>
            <summary role="button">All Graphs</summary>
            <ul class="flex flex-wrap justify-center gap-2">
              <For each={graphs()} fallback={<div>No graphs found</div>}>
                {(graph) => (
                  <li class="list-none before:mr-2 before:content-['•']">
                    <a
                      href={`/graph/${graph.id}`}
                      class="visited:text-visited visited:decoration-visited transition-none"
                    >
                      {graph.label}
                    </a>
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
