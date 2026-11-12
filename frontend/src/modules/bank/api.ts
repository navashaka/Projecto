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

const bankApi = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' }
})

export type BankResource =
  | 'passbooks'
  | 'books'
  | 'receipts'
  | 'receipt-items'
  | 'payments'
  | 'payment-items'
  | 'reconciliations'

export type BankRecord = {
  id: number
  [key: string]: unknown
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
        : error.message || 'Bank API request failed.'
    )
  }
  return error instanceof Error ? error : new Error('Bank API request failed.')
}

const request = async <T,>(operation: () => Promise<T>): Promise<T> => {
  try {
    return await operation()
  } catch (error) {
    throw unwrapError(error)
  }
}

const resourcePath = (resource: BankResource) =>
  `/api/v1/bank/${encodeURIComponent(resource)}`

export const getBankRecords = (resource: BankResource) =>
  request(() =>
    bankApi.get<BankRecord[]>(resourcePath(resource)).then((response) => response.data)
  )

export const getBankRecord = (resource: BankResource, id: number | string) =>
  request(() =>
    bankApi
      .get<BankRecord>(`${resourcePath(resource)}/${encodeURIComponent(id)}`)
      .then((response) => response.data)
  )

export const createBankRecord = (
  resource: BankResource,
  payload: Record<string, unknown>
) =>
  request(() =>
    bankApi.post<BankRecord>(resourcePath(resource), payload)
      .then((response) => response.data)
  )

export const updateBankRecord = (
  resource: BankResource,
  id: number | string,
  payload: Record<string, unknown>
) =>
  request(() =>
    bankApi
      .put<BankRecord>(`${resourcePath(resource)}/${encodeURIComponent(id)}`, payload)
      .then((response) => response.data)
  )

export const deleteBankRecord = (resource: BankResource, id: number | string) =>
  request(() =>
    bankApi.delete(`${resourcePath(resource)}/${encodeURIComponent(id)}`)
  )
