type CancellablePromise<T> = Promise<T> & { cancel: () => void }

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

  async process(n?: number) {
    const items = n ? this.queue.splice(0, n) : this.queue.splice(0)
    this.queue = [] // clear queue before processing

    if (items.length === 0) return

    const dataArray = items.map((item) => item.data)

    try {
      const results = await this.processFn(dataArray)

      results.forEach((result, index) => {
        const item = items[index]
        if (!item.cancelled) {
          item.resolve(result)
        }
      })
    } catch (err) {
      items.forEach((item) => {
        if (!item.cancelled) {
          item.reject(err)
        }
      })
    }
  }
}
