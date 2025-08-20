import fetchEntities from "../fetchers/fetchEntities"
import BatchProcessor from "../services/BatchProcessor"
import { Entity, EntityResult } from "../types"

export default class EntityProvider {
  private entityCache = new Map<number, Entity>()
  private entityFetcher: BatchProcessor<number, EntityResult>

  constructor() {
    this.entityFetcher = new BatchProcessor(async (ids: number[]) => {
      const entities = await fetchEntities(ids)
      entities.forEach((entity) => this.entityCache.set(entity.id, entity))
      return ids.map(
        (id) => this.entityCache.get(id) || { id, error: "Entity not found" }
      )
    })
  }

  requestEntity(id: number) {
    if (this.entityCache.has(id)) {
      return {
        promise: Promise.resolve(this.entityCache.get(id)!),
        cancel: () => {},
      }
    }
    return this.entityFetcher.enqueue(id)
  }

  processRequests() {
    return this.entityFetcher.process()
  }
}
