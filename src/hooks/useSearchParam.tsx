import { useSearchParams } from "@solidjs/router"

export default function useSearchParam(param: string) {
  const [searchParams] = useSearchParams()
  const value = searchParams[param]
  if (!value) return undefined
  return Array.isArray(value) ? value[0] : value
}
