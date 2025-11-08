import { Title } from "@solidjs/meta"
import { HttpStatusCode } from "@solidjs/start"
import Footer from "~/components/Footer"
import Header from "~/components/Header"

export default function GraphNotFoundPage() {
  return (
    <>
      <HttpStatusCode code={404} />
      <Title>Graph Not Found - Graphpedia</Title>
      <Header />
      <main class="flex flex-col gap-8 py-16 text-center">
        <h1 class="text-6xl font-thin">Graph Not Found</h1>
        <div>
          <p>It seems like the graph you're looking for doesn't exist.</p>
          <p>
            Make sure the graph ID starts with a <em>capital P</em> followed by
            a number.
          </p>
          <p>
            <strong> Example graph URL: </strong>
            <code>https://graphpedia.org/graph/P35</code>
          </p>
        </div>
        <p>
          <mark>
            Note: Not all Wikidata properties are available as graphs on
            Graphpedia.
          </mark>
        </p>
        <p>
          <strong>Try one of these:</strong>
        </p>
        <p class="flex flex-col gap-2">
          <a href="/">Go to homepage</a>
          <a href="/graphs">Browse all graphs</a>
        </p>
      </main>
      <Footer />
    </>
  )
}
