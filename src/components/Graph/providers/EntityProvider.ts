import wbk from "wikibase-sdk"
import { Entity, PendingRequest } from "../types"

type RequestHandle = {
  entityId: number
  resolve: (entity: Entity) => void
  reject: (error: Error) => void
}

async function fetchEntities(ids: number[]): Promise<Entity[]> {
  const wbkInstance = wbk({
    instance: "https://www.wikidata.org",
    sparqlEndpoint: "https://query.wikidata.org/sparql",
  })

  const sparql = `
    SELECT ?item ?itemLabel ?itemDescription ?image WHERE {
      VALUES ?item { ${ids.map((id) => `wd:Q${id}`).join(" ")} }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      OPTIONAL { ?item wdt:P18 ?image. }
    }
  `
  const url = wbkInstance.sparqlQuery(sparql)
  const response = await fetch(url)

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    throw new Error(`SPARQL request failed: ${response.status} ${errorText}`)
  }

  const json = await response.json()

  const results: Entity[] = json.results.bindings.map(
    ({ item, itemLabel, itemDescription, image }: any) => ({
      id: parseInt(item.value.replace("http://www.wikidata.org/entity/Q", "")),
      name: itemLabel?.value || "",
      description: itemDescription?.value || "",
      imageUrl: image?.value || "",
    })
  )

  return results
}

export default class EntityProvider {
  private requests: RequestHandle[] = []
  private entityCache = new Map<number, Entity>()

  requestEntity(entityId: number): PendingRequest<Entity> {
    if (this.entityCache.has(entityId)) {
      const cachedEntity = this.entityCache.get(entityId)!
      return {
        promise: Promise.resolve(cachedEntity),
        cancel: () => {},
      }
    }

    let requestHandle: RequestHandle

    const promise = new Promise<Entity>((resolve, reject) => {
      requestHandle = { entityId, resolve, reject }
      this.requests.push(requestHandle)
    })

    const cancel = () => {
      const index = this.requests.indexOf(requestHandle)
      if (index !== -1) {
        this.requests.splice(index, 1)
      }
    }

    return { promise, cancel }
  }

  async resolveRequests() {
    const requests = this.requests.splice(0)
    if (requests.length === 0) return

    try {
      const entities = await fetchEntities(requests.map((req) => req.entityId))

      for (const entity of entities) {
        this.entityCache.set(entity.id, entity)
      }

      for (const req of requests) {
        const entity = this.entityCache.get(req.entityId)
        if (entity) {
          req.resolve(entity)
        } else {
          req.reject(new Error(`No entity found for ID ${req.entityId}`))
        }
      }
    } catch (error) {
      console.error("Failed to fetch entities:", error)
      // Re-add failed requests back to the queue for retry
      this.requests.push(...requests)
    }
  }
}
