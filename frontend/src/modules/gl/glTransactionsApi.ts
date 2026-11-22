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

const glApi = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' }
})

export type GLTransactionResource =
  | 'contra-entries'
  | 'journal-entries'
  | 'credit-notes'
  | 'debit-notes'

export type GLTransactionRecord = {
  id: number
  [key: string]: unknown
}

export type GLLookup = {
  id: string | number
  label: string
  requires_cost_element?: boolean
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
        : error.message || 'GL transaction request failed.'
    )
  }
  return error instanceof Error ? error : new Error('GL transaction request failed.')
}

const request = async <T,>(operation: () => Promise<T>): Promise<T> => {
  try {
    return await operation()
  } catch (error) {
    throw unwrapError(error)
  }
}

const resourcePath = (resource: GLTransactionResource) =>
  `/api/v1/gl-transactions/${encodeURIComponent(resource)}`

export const getGLTransactions = (resource: GLTransactionResource) =>
  request(() =>
    glApi.get<GLTransactionRecord[]>(resourcePath(resource))
      .then((response) => response.data)
  )

export const getGLTransaction = (
  resource: GLTransactionResource,
  id: number | string
) =>
  request(() =>
    glApi.get<GLTransactionRecord>(
      `${resourcePath(resource)}/${encodeURIComponent(id)}`
    ).then((response) => response.data)
  )

export const createGLTransaction = (
  resource: GLTransactionResource,
  payload: Record<string, unknown>
) =>
  request(() =>
    glApi.post<GLTransactionRecord>(resourcePath(resource), payload)
      .then((response) => response.data)
  )

export const updateGLTransaction = (
  resource: GLTransactionResource,
  id: number | string,
  payload: Record<string, unknown>
) =>
  request(() =>
    glApi.put<GLTransactionRecord>(
      `${resourcePath(resource)}/${encodeURIComponent(id)}`,
      payload
    ).then((response) => response.data)
  )

export const deleteGLTransaction = (
  resource: GLTransactionResource,
  id: number | string
) =>
  request(() =>
    glApi.delete(`${resourcePath(resource)}/${encodeURIComponent(id)}`)
  )

export const getGLLookups = (resource: string) =>
  request(() =>
    glApi.get<GLLookup[]>(
      `/api/v1/gl-transactions/lookups/${encodeURIComponent(resource)}`
    ).then((response) => response.data)
  )
