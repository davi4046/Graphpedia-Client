import WBK from "wikibase-sdk"

export interface EntityData {
  id: number
  name: string
  description: string
  imageUrl?: string
}

export async function fetchEntities(
  entityIds: number[]
): Promise<Map<number, EntityData>> {
  const wbkInstance = WBK({
    instance: "https://www.wikidata.org",
    sparqlEndpoint: "https://query.wikidata.org/sparql",
  })

  const sparql = `
        SELECT ?item ?itemLabel ?itemDescription ?image WHERE {
            VALUES ?item { ${entityIds.map((id) => `wd:Q${id}`).join(" ")} }
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

  const parseId = (item: any) =>
    parseInt(item.value.replace("http://www.wikidata.org/entity/Q", ""))

  const results: EntityData[] = json.results.bindings.map(
    ({ item, itemLabel, itemDescription, image }: any) => ({
      id: parseId(item),
      name: itemLabel?.value || "",
      description: itemDescription?.value || "",
      imageUrl: image?.value || "",
    })
  )

  const entityMap = new Map<number, EntityData>()
  for (const entity of results) {
    entityMap.set(entity.id, entity)
  }

  return entityMap
}
