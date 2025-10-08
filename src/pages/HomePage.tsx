import { Link } from "@solidjs/meta"
import { For } from "solid-js"
import Graph from "~/components/Graph"
import Nav from "~/components/Nav"
import { useGraphList } from "./useGraphList"

export default function HomePage() {
  const graphList = useGraphList()

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
          <div class="relative h-72 border border-gray-300">
            <Graph graphId="P35" />
            <div class="pointer-events-none absolute inset-0 shadow-inner"></div>
          </div>
        </section>
        <section id="graphs">
          <details open>
            <summary role="button">All Graphs</summary>
            <ul class="flex flex-wrap justify-center gap-2">
              <For each={graphList()} fallback={<div>No graphs found</div>}>
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
