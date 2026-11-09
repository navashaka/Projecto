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

const purchaseApi = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' }
})

export type PurchaseFormType =
  | 'vendors'
  | 'advance-requisitions'
  | 'quotation-comparisons'
  | 'orders'

export type PurchaseFormRecord = {
  id: number
  form_type: PurchaseFormType
  payload: Record<string, string>
}

const unwrapError = (error: unknown): Error => {
  if (
    axios.isAxiosError<{
      detail?: string | Array<{ msg?: string }>
    }>(error)
  ) {
    const detail = error.response?.data?.detail
    const message = Array.isArray(detail)
      ? detail.map((issue) => issue.msg).filter(Boolean).join('; ')
      : detail
    return new Error(
      typeof message === 'string' && message
        ? message
        : error.message || 'Purchase API request failed.'
    )
  }
  return error instanceof Error ? error : new Error('Purchase API request failed.')
}

const withPurchaseError = async <T,>(request: () => Promise<T>): Promise<T> => {
  try {
    return await request()
  } catch (error) {
    throw unwrapError(error)
  }
}

const resourcePath = (formType: PurchaseFormType) =>
  `/api/v1/purchases/${encodeURIComponent(formType)}`

export const getPurchaseRecords = (formType: PurchaseFormType) =>
  withPurchaseError(() =>
    purchaseApi
      .get<PurchaseFormRecord[]>(resourcePath(formType))
      .then((response) => response.data)
  )

export const createPurchaseRecord = (
  formType: PurchaseFormType,
  payload: Record<string, string>
) =>
  withPurchaseError(() =>
    purchaseApi
      .post<PurchaseFormRecord>(resourcePath(formType), { payload })
      .then((response) => response.data)
  )

export const updatePurchaseRecord = (
  formType: PurchaseFormType,
  recordId: string,
  payload: Record<string, string>
) =>
  withPurchaseError(() =>
    purchaseApi
      .put<PurchaseFormRecord>(
        `${resourcePath(formType)}/${encodeURIComponent(recordId)}`,
        { payload }
      )
      .then((response) => response.data)
  )

export const deletePurchaseRecord = (
  formType: PurchaseFormType,
  recordId: string
) =>
  withPurchaseError(() =>
    purchaseApi.delete(
      `${resourcePath(formType)}/${encodeURIComponent(recordId)}`
    )
  )
