import { catchError } from "~/utils/error"

export class BatchFetcher<T> {
  private pending: Map<
    number,
    {
      resolve: (value: T) => void
      reject: (reason?: any) => void
      promise: Promise<T>
    }
  > = new Map()

  constructor(
    private fetchFn: (ids: number[]) => Promise<Map<number, T>>,
    private batchSize: number
  ) {}

  async get(id: number): Promise<T> {
    let resolve: (value: T) => void = () => {}
    let reject: (reason?: any) => void = () => {}

    if (this.pending.has(id)) {
      return this.pending.get(id)!.promise
    }

    const promise = new Promise<T>((res, rej) => {
      resolve = res
      reject = rej
    })

    this.pending.set(id, { resolve, reject, promise })

    if (this.pending.size >= this.batchSize) {
      this.flush()
    }

    return promise
  }

  async flush() {
    if (this.pending.size === 0) return

    const currentBatch = new Map(this.pending)
    this.pending.clear()

    const ids = Array.from(currentBatch.keys())

    const [err, results] = await catchError(this.fetchFn(ids))
    if (err) {
      for (const { reject } of currentBatch.values()) {
        reject(new Error("Failed to fetch data:", { cause: err }))
      }
      return
    }

    for (const [id, entry] of currentBatch.entries()) {
      const result = results.get(id)
      if (result) {
        entry.resolve(result)
      } else {
        entry.reject(new Error(`No data for id: ${id}`))
      }
    }
  }
}
