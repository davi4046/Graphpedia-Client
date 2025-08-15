import { EntityData } from "../types"

export default async function fetchEntities(
  ids: string[]
): Promise<EntityData[]> {
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

  const results: EntityData[] = json.results.bindings.map((binding: any) => ({
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
