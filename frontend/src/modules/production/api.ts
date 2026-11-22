import axios from 'axios'

const configuredApiUrl = import.meta.env.VITE_API_URL
  ?? import.meta.env.VITE_API_BASE_URL
  ?? 'http://localhost:8000'
const baseURL =
  import.meta.env.DEV ||
  (typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    configuredApiUrl.startsWith('http:'))
    ? ''
    : configuredApiUrl

const productionApi = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' }
})

export type ProductionInputItem = {
  id: number
  input_item_name: string
}

export type ProductionRecord = {
  id: number
  output_product_name: string
  uom: string | null
  hsn: string | null
  cost_element: string | null
  input_items: ProductionInputItem[]
}

export type ProductionEntryConsumption = {
  id: number
  input_item_name: string
  qty_consumed: number
}

export type ProductionEntryRecord = {
  id: number
  production_id: number
  production_date: string
  shift_a: number
  shift_b: number
  shift_c: number
  total_qty: number
  consumption: ProductionEntryConsumption[]
}

export type ProductionPayload = {
  output_product_name: string
  uom: string | null
  hsn: string | null
  cost_element: string | null
  input_items: { input_item_name: string }[]
}

export type ProductionEntryPayload = {
  production_id: number
  production_date: string
  shift_a: number
  shift_b: number
  shift_c: number
  consumption: { input_item_name: string; qty_consumed: number }[]
}

const unwrapError = (error: unknown): Error => {
  if (axios.isAxiosError<{ detail?: string | Array<{ msg?: string }> }>(error)) {
    const detail = error.response?.data?.detail
    const message = Array.isArray(detail)
      ? detail.map((issue) => issue.msg).filter(Boolean).join('; ')
      : detail
    return new Error(
      typeof message === 'string' && message
        ? message
        : error.message || 'Production API request failed.'
    )
  }
  return error instanceof Error ? error : new Error('Production API request failed.')
}

const request = async <T,>(operation: () => Promise<T>): Promise<T> => {
  try {
    return await operation()
  } catch (error) {
    throw unwrapError(error)
  }
}

export const getProductions = () =>
  request(() =>
    productionApi.get<ProductionRecord[]>('/api/v1/production/')
      .then((response) => response.data)
  )

export const createProduction = (payload: ProductionPayload) =>
  request(() =>
    productionApi.post<ProductionRecord>('/api/v1/production/', payload)
      .then((response) => response.data)
  )

export const updateProduction = (
  productionId: string,
  payload: ProductionPayload
) =>
  request(() =>
    productionApi.put<ProductionRecord>(
      `/api/v1/production/${encodeURIComponent(productionId)}`,
      payload
    ).then((response) => response.data)
  )

export const deleteProduction = (productionId: string) =>
  request(() =>
    productionApi.delete(`/api/v1/production/${encodeURIComponent(productionId)}`)
  )

export const getProductionEntries = (productionId: number) =>
  request(() =>
    productionApi.get<ProductionEntryRecord[]>(
      `/api/v1/production/entries/${productionId}`
    ).then((response) => response.data)
  )

export const createProductionEntry = (payload: ProductionEntryPayload) =>
  request(() =>
    productionApi.post<ProductionEntryRecord>(
      '/api/v1/production/entries/',
      payload
    ).then((response) => response.data)
  )
