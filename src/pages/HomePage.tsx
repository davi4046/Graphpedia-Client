import { Link, Meta, Title } from "@solidjs/meta"
import { For } from "solid-js"
import Footer from "~/components/Footer"
import Header from "~/components/Header"
import useGraphList from "~/hooks/useGraphList"

export default function HomePage() {
  const graphList = useGraphList()

  return (
    <>
      <Title>Graphpedia</Title>
      <Meta
        name="description"
        content="Home to more than 1600 visual knowledge graphs based on Wikidata statements."
      />
      <Link rel="canonical" href="/" />
      <Meta property="og:type" content="website" />
      <Meta property="og:url" content="https://graphpedia.org/" />
      <Meta property="og:title" content="Graphpedia" />
      <Meta
        property="og:description"
        content="Home to more than 1600 visual knowledge graphs based on Wikidata statements."
      />
      <Header />
      <main>
        <section id="welcome" class="relative py-16">
          <div class="bg-hero pointer-events-none absolute inset-0 -z-10 bg-repeat opacity-50"></div>
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
          <iframe
            src="/graph/P35"
            class="h-72 w-full border border-gray-300"
          ></iframe>
          <div class="mt-2 mb-8 text-right">
            <a href="/graph/P35">View full page ↗</a>
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
      <Footer />
    </>
  )
}
