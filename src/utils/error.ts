export type Result<T> = [undefined, T] | [Error]

export async function catchError<T>(promise: Promise<T>): Promise<Result<T>> {
  try {
    const data = await promise
    return [undefined, data]
  } catch (error) {
    return [error as Error]
  }
}
