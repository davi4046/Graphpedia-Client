import { Title } from "@solidjs/meta"
import Footer from "~/components/Footer"
import Header from "~/components/Header"

export default function NotFound() {
  return (
    <>
      <Title>Page Not Found - Graphpedia</Title>
      <Header />
      <main class="flex flex-col gap-8 py-16 text-center">
        <h1 class="text-6xl font-thin">Page Not Found</h1>
        <p>It seems like the page you're looking for doesn't exist.</p>
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
