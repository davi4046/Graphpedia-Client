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
          <div class="grid grid-cols-3">
            <article class="clickable outline">
              <h3 class="mb-3 text-xl">
                <a href="">field of work</a>
              </h3>
              <p>
                specialization of a person or organization; see P106 for the
                occupation
              </p>
              <footer class="flex justify-between">
                <small>42 nodes, 131 edges</small>
                <small>
                  <a
                    href="https://www.wikidata.org/wiki/Property:P101"
                    target="_blank"
                    rel="noopener"
                    class="whitespace-nowrap"
                  >
                    View on Wikidata
                  </a>
                </small>
              </footer>
            </article>
            <article class="outline">
              <h3 class="mb-3 text-xl">
                <a href="">member of political party</a>
              </h3>
              <p>
                the political party of which a person is or has been a member or
                otherwise affiliated
              </p>
              <footer class="flex justify-between">
                <small>42 nodes, 131 edges</small>
                <small>
                  <a
                    href="https://www.wikidata.org/wiki/Property:P101"
                    target="_blank"
                    rel="noopener"
                    class="whitespace-nowrap"
                  >
                    View on Wikidata
                  </a>
                </small>
              </footer>
            </article>
            <article class="outline">
              <h3 class="mb-3 text-xl">
                <a href="">native language</a>
              </h3>
              <p>
                language or languages a person has learned from early childhood
              </p>
              <footer class="flex justify-between">
                <small>42 nodes, 131 edges</small>
                <small>
                  <a
                    href="https://www.wikidata.org/wiki/Property:P101"
                    target="_blank"
                    rel="noopener"
                    class="whitespace-nowrap"
                  >
                    View on Wikidata
                  </a>
                </small>
              </footer>
            </article>
          </div>
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
