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
        <div>HomePage</div>
      </main>

      <footer>
        <div>Footer</div>
      </footer>
    </>
  )
}
