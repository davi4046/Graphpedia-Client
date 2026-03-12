import { MetaProvider } from "@solidjs/meta"
import { Router } from "@solidjs/router"
import { FileRoutes } from "@solidjs/start/router"
import { ErrorBoundary, Suspense } from "solid-js"
import "./styles/app.scss"

export default function App() {
  return (
    <Router
      root={(props) => (
        <ErrorBoundary
          fallback={(e) => {
            console.error("APP ERROR:", e.message)
            console.error("APP STACK:", e.stack)
            return <div>Error: {e.message}</div>
          }}
        >
          <MetaProvider>
            <Suspense>{props.children}</Suspense>
          </MetaProvider>
        </ErrorBoundary>
      )}
    >
      <FileRoutes />
    </Router>
  )
}
