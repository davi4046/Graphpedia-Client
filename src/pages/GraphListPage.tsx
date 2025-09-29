import { Link } from "@solidjs/meta"
import Nav from "~/components/Nav"

export default function GraphListPage() {
  return (
    <>
      <Link rel="canonical" href="/graphs" />

      <header>
        <Nav />
      </header>

      <main>
        <div>GraphListPage</div>
      </main>

      <footer>
        <div>Footer</div>
      </footer>
    </>
  )
}
