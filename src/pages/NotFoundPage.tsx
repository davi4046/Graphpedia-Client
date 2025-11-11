import { Title } from "@solidjs/meta"
import { HttpStatusCode } from "@solidjs/start"
import Footer from "~/components/Footer"
import Header from "~/components/Header"

export default function NotFoundPage() {
  return (
    <>
      <HttpStatusCode code={404} />
      <Title>Not Found - Graphpedia</Title>
      <Header />
      <main class="flex flex-col gap-8 py-16 text-center">
        <h1 class="text-6xl font-thin">Not Found</h1>
        <p>It seems like the page you're looking for doesn't exist.</p>
        <div>
          <a href="/">Homepage</a>
        </div>
      </main>
      <Footer />
    </>
  )
}
