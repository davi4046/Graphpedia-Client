export interface WbEntityResponse {
  id: number
  name: string
  description: string
}

export async function fetchEntities(
  ids: number[]
): Promise<WbEntityResponse[]> {
  const url = new URL("https://www.wikidata.org/w/api.php")

  url.search = new URLSearchParams({
    action: "wbgetentities",
    ids: ids.map((id) => `Q${id}`).join("|"),
    props: "labels|descriptions",
    languages: "en",
    format: "json",
    origin: "*",
  }).toString()

  // TODO: better error handling
  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Error fetching Wikidata entities: ${response.status}`)
  }

  // TODO: better error handling
  const json = await response.json()
  if (json.success !== 1) {
    throw new Error(`Error fetching Wikidata entities: ${JSON.stringify(json)}`)
  }

  const entities = Object.values(json.entities).map((entity: any) => ({
    id: parseInt(entity.id.slice(1)),
    name: entity.labels?.en?.value ?? `Q${entity.id.slice(1)}`,
    description: entity.descriptions?.en?.value ?? "",
  }))

  return entities
}
