import { DATA_URL, SITE_URL } from "~/config"

export type GraphEntry = {
  id: string
  label: string
  description: string
  aliases: string[]
  workInProgress: boolean
  url: string
  wikidataUrl: string
}

export default async function fetchGraphsIndex(
  dataUrl = DATA_URL
): Promise<GraphEntry[]> {
  const url = `${dataUrl}/graphs_index.json.gz`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.statusText}`)
  }

  const entries = await response.json()

  return entries.map((entry: any) => ({
    id: entry.id,
    label: entry.label,
    description: entry.description,
    aliases: entry.aliases,
    workInProgress: entry["work_in_progress"],
    url: `${SITE_URL}/graph/${entry.id}`,
    wikidataUrl: `https://www.wikidata.org/wiki/Property:${entry.id}`,
  }))
}
