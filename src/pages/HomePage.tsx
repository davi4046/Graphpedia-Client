import { Link } from "@solidjs/meta"
import Nav from "~/components/Nav"

export default function HomePage() {
  return (
    <>
      <Link rel="canonical" href="/" />

      <header>
        <Nav />
      </header>

      <main>
        <div class="flex flex-col items-center">
          <h1 class="self-center">Welcome to Graphpedia</h1>
          <p>
            home to more than 1600 visual knowledge graphs based on{" "}
            <a href="https://www.wikidata.org/">Wikidata</a> statements.
          </p>
          <a href="/graphs" role="button" class="outline">
            Browse Graphs
          </a>
        </div>
      </main>

      <footer>
        <div>Footer</div>
      </footer>
    </>
  )
}
