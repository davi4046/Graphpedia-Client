import { EntityType, SearchResult, UrlResultFormat, Wbk } from "wikibase-sdk"

export interface SearchEntitiesOptions {
  search: string
  limit: number
  language?: string
  uselang?: string
  format?: UrlResultFormat
  type?: EntityType
}

export async function searchEntitiesFiltered(
  wbk: Wbk,
  options: SearchEntitiesOptions,
  filter: (result: SearchResult) => boolean
) {
  const results: SearchResult[] = []
  let continueOffset: number | undefined

  while (results.length < options.limit) {
    const url = wbk.searchEntities({
      search: options.search,
      language: options.language,
      uselang: options.uselang,
      format: options.format,
      type: options.type,
      limit: options.limit * 2,
      continue: continueOffset,
    })

    const response = await fetch(url)
    const json = await response.json()

    for (const result of json.search) {
      if (filter(result) && results.length < options.limit) {
        results.push(result)
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
