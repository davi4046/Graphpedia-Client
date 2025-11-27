import { Style, Title } from "@solidjs/meta"
import { HttpStatusCode } from "@solidjs/start"
import Footer from "~/components/Footer"
import Header from "~/components/Header"

export default function NotFoundPage() {
  return (
    <>
      <HttpStatusCode code={404} />
      <Title>Not Found - Graphpedia</Title>
      <Style>
        {`
          #app {
            min-height: 100vh; 
            display: grid; 
            grid-template-rows: auto 1fr auto;  
          }
        `}
      </Style>
      <Header />
      <main>
        <div class="flex aspect-square h-full flex-col justify-center border-2 border-dashed border-gray-300 p-8 text-center sm:aspect-auto">
          <h1>Not Found</h1>
          <p class="mb-0">
            It seems like the page you're looking for doesn't exist.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
