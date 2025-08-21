import { Entity, PendingRequest } from "../types"

type RequestHandle = {
  entityId: number
  resolve: (entity: Entity) => void
  reject: (error: Error) => void
}

async function fetchEntities(ids: number[]): Promise<Entity[]> {
  const sparqlQuery = `
    SELECT ?item ?itemLabel ?itemDescription ?image WHERE {
      VALUES ?item { ${ids.map((id) => `wd:Q${id}`).join(" ")} }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      OPTIONAL { ?item wdt:P18 ?image. } # P18 is the image property
    }
  `

  const response = await fetch("https://query.wikidata.org/sparql", {
    method: "POST", // It's better to use POST because the query can be long
    headers: {
      Accept: "application/sparql-results+json", // This makes sure you get JSON results
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `query=${encodeURIComponent(sparqlQuery)}`,
  })

  const json = await response.json()

  const results: Entity[] = json.results.bindings.map((binding: any) => ({
    id: parseInt(
      binding.item.value.replace("http://www.wikidata.org/entity/Q", ""),
      10
    ),
    name: binding.itemLabel?.value || "",
    description: binding.itemDescription?.value || "",
    imageUrl: binding.image?.value,
  }))

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
