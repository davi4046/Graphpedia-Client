import { CancellablePromise } from "../types"

export default class BatchProcessor<T, U> {
  private queue: {
    data: T
    resolve: (value: U) => void
    reject: (reason?: any) => void
    cancelled: boolean
  }[] = []

  constructor(private processFn: (data: T[]) => Promise<U[]>) {}

  enqueue(data: T): CancellablePromise<U> {
    let cancelled = false

    const promise = new Promise<U>((resolve, reject) => {
      this.queue.push({ data, resolve, reject, cancelled })
    }) as CancellablePromise<U>

    promise.cancel = () => {
      cancelled = true
      // mark the queued item as cancelled so process() will skip it
      const item = this.queue.find(
        (q) => q.resolve === (promise as any).resolve
      )
      if (item) item.cancelled = true
    }

    return promise
  }

  private takeFirstItems(n?: number) {
    const result: typeof this.queue = []
    let count = 0

    while (this.queue.length > 0 && (n === undefined || count < n)) {
      const item = this.queue.shift()!
      if (!item.cancelled) {
        result.push(item)
        count++
      }
    }

    return result
  }

  async process(n?: number) {
    const items = this.takeFirstItems(n)
    if (items.length === 0) return

    const dataArray = items.map((item) => item.data)

    try {
      const results = await this.processFn(dataArray)

      items.forEach((item, idx) => {
        if (idx < results.length) {
          item.resolve(results[idx])
        } else {
          item.reject(new Error("Missing result"))
        }
      })
    } catch (err) {
      items.forEach((item) => item.reject(err))
    }
  }
}
