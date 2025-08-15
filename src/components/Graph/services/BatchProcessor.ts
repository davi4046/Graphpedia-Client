export default class BatchProcessor<T> {
  private subscribers: Map<string, (data: T | undefined) => void> = new Map()

  constructor(private processFn: (ids: string[]) => Promise<T[]>) {}

  register(id: string, cb: (data: T | undefined) => void) {
    this.subscribers.set(id, cb)
    return () => {
      this.subscribers.delete(id)
    }
  }

  async processAll() {
    const ids = Array.from(this.subscribers.keys())
    const results = await this.processFn(ids)
    ids.forEach((id, index) => {
      const cb = this.subscribers.get(id)
      cb?.(results[index])
    })
  }
}
