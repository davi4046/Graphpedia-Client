export interface WbEntityResult {
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

export async function searchEntities(query: string): Promise<WbEntityResult[]> {
  // TODO
}
