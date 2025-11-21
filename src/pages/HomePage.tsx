import { Link, Meta, Title } from "@solidjs/meta"
import { For } from "solid-js"
import Footer from "~/components/Footer"
import Header from "~/components/Header"
import { SITE_URL } from "~/config"
import useGraphList from "~/hooks/useGraphList"

export default function HomePage() {
  const graphList = useGraphList()

  const scrollToGraphs = () => {
    document.getElementById("graphs")?.scrollIntoView({ behavior: "smooth" })
  }

  const goToRandomGraph = () => {
    const graphs = graphList()
    if (!graphs || graphs.length === 0) return
    const randomGraph = graphs[Math.floor(Math.random() * graphs.length)]
    window.location.href = randomGraph.url
  }

  return (
    <>
      <Title>Graphpedia</Title>
      <Meta
        name="description"
        content="Graphpedia is an independent open knowledge project inspired by the Wikimedia movement. Dive into 1,600+ visual knowledge graphs based on Wikidata statements."
      />
      <Link rel="canonical" href="/" />
      <Meta property="og:type" content="website" />
      <Meta property="og:url" content={SITE_URL} />
      <Meta property="og:title" content="Graphpedia" />
      <Meta
        property="og:description"
        content="Graphpedia is an independent open knowledge project inspired by the Wikimedia movement. Dive into 1,600+ visual knowledge graphs based on Wikidata statements."
      />
      <Header />
      <main>
        <section id="welcome" class="relative py-16">
          <div class="bg-hero pointer-events-none absolute inset-0 -z-10 bg-repeat opacity-50"></div>
          <div class="flex flex-col items-center">
            <h1>Welcome to Graphpedia</h1>
            <p class="text-center">
              home to more than 1,600 visual knowledge graphs based on{" "}
              <a href="https://www.wikidata.org/">Wikidata</a> statements.
            </p>
            <div class="flex gap-2">
              <button onClick={scrollToGraphs} title="Scroll to the graph list">
                Browse the list ↓
              </button>
              <button
                class="secondary"
                onClick={goToRandomGraph}
                title="Go to a random graph"
              >
                Take a chance 🎲
              </button>
            </div>
          </div>
        </section>
        <section id="featured">
          <h2>Featured Graph</h2>
          <iframe
            src="/graph/P35"
            class="h-84 w-full border border-gray-300"
          ></iframe>
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
