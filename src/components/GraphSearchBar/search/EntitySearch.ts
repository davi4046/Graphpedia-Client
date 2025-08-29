import wbk from "wikibase-sdk"

type WbEntityResult = {
  id: string
  title: string
  pageid: number
  concepturi: string
  repository: "wikidata"
  url: string
  display: {
    label: {
      value: string
      language: string // usually ISO code like "en"
    }
    description: {
      value: string
      language: string
    }
  }
  label: string
  description: string
  match: {
    type: "label" | "alias" | "description"
    language: string
    text: string
  }
}

type EntityId = string

export default class EntitySearch {
  private wbkInstance = wbk({
    instance: "https://www.wikidata.org",
    sparqlEndpoint: "https://query.wikidata.org/sparql",
  })

  async search(
    value: string,
    limit: number = 10,
    filter?: ReadonlySet<EntityId>
  ): Promise<WbEntityResult[]> {
    const results: WbEntityResult[] = []
    let continueOffset: number | undefined

    while (results.length < limit) {
      const url = this.wbkInstance.searchEntities({
        search: value,
        limit: 50,
        continue: continueOffset,
        language: "en",
        uselang: "en",
        format: "json",
      })

      const res = await fetch(url)
      const json = await res.json()

      for (const item of json.search) {
        if ((!filter || filter.has(item.id)) && results.length < limit) {
          results.push(item)
        }
      }

      // If no more pages → stop
      if (!json["search-continue"] || json.search.length === 0) {
        break
      }

      continueOffset = json["search-continue"]
    }

    return results
  }
}
