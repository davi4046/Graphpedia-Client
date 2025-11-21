import WBK, { Entity, EntityId, Item } from "wikibase-sdk"
import { USER_AGENT } from "~/config"

export async function fetchEntities(ids: string[]): Promise<Entity[]> {
  const wbk = WBK({ instance: "https://www.wikidata.org" })
  const url = wbk.getEntities({
    ids: ids as EntityId[],
    props: ["labels", "descriptions", "sitelinks/urls"],
    languages: ["en"],
    format: "json",
  })
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
    },
  })
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`)
  }
  const json = await response.json()
  return Object.values(json.entities)
}

export async function fetchItems(ids: string[]): Promise<Item[]> {
  return fetchEntities(ids) as Promise<Item[]>
}
