import axios from 'axios'
import type { ModuleId } from './types'

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

const moduleFormsApi = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' }
})

export type ModuleFormRecord = {
  id: number
  payload: Record<string, unknown>
}

export type ModuleFormLookup = {
  id: number
  label: string
}

const resourceByTitle: Partial<Record<ModuleId, Record<string, string>>> = {
  inventory: {
    'Unit of Measurement': 'units',
    'Gate Entry': 'gate-entries',
    'Stock Group': 'stock-groups',
    'Stock Item': 'stock-items',
    Indent: 'indents',
    'Material Receipt Note': 'material-receipt-notes',
    'Delivery Challan (Inward)': 'delivery-challans-inward',
    'Delivery Challan (Outward)': 'delivery-challans-outward',
    'Goods Issue (For Consumption)': 'goods-issues',
    'Goods Issue (For Sale)': 'goods-issue-sales'
  },
  ar: {
    Customer: 'customers',
    Invoice: 'invoices',
    'Proforma Invoice': 'proforma-invoices',
    Quotation: 'quotations',
    'Tax Invoice': 'tax-invoices'
  },
  gl: {
    'Tax Type': 'tax-types',
    Group: 'groups',
    'GL Account': 'accounts',
    'Create HSN': 'hsn-masters',
    'Create SAC': 'sac-masters',
    'Bank Accounts': 'bank-accounts',
    'Cheque Range': 'cheque-ranges',
    'OD Limit': 'od-limits',
    'Tax Applicability': 'tax-applicability',
    'Bank OCC Account / OD Account / CC Account': 'bank-accounts',
    'Fixed Assets': 'fixed-assets',
    'Secured Loans': 'secured-loans',
    'Unsecured Loans': 'unsecured-loans',
    'Sundry Creditors': 'sundry-creditors',
    'Sundry Debtors': 'sundry-debtors'
  }
}

const unwrapError = (error: unknown): Error => {
  if (axios.isAxiosError<{ detail?: string | Array<{ msg?: string }> }>(error)) {
    const detail = error.response?.data?.detail
    const message = Array.isArray(detail)
      ? detail.map((issue) => issue.msg).filter(Boolean).join('; ')
      : detail
    return new Error(
      typeof message === 'string' && message ? message : error.message || 'Module API request failed.'
    )
  }
  return error instanceof Error ? error : new Error('Module API request failed.')
}

const request = async <T,>(operation: () => Promise<T>): Promise<T> => {
  try {
    return await operation()
  } catch (error) {
    throw unwrapError(error)
  }
}

export const getModuleFormResource = (module: ModuleId, title: string) =>
  resourceByTitle[module]?.[title.trim()]

const resourcePath = (module: ModuleId, resource: string) =>
  `/api/v1/module-forms/${encodeURIComponent(module)}/${encodeURIComponent(resource)}`

export const getModuleFormRecords = (module: ModuleId, resource: string) =>
  request(() =>
    moduleFormsApi.get<ModuleFormRecord[]>(resourcePath(module, resource))
      .then((response) => response.data)
  )

export const getModuleFormRecord = (module: ModuleId, resource: string, id: string) =>
  request(() =>
    moduleFormsApi.get<ModuleFormRecord>(`${resourcePath(module, resource)}/${encodeURIComponent(id)}`)
      .then((response) => response.data)
  )

export const createModuleFormRecord = (
  module: ModuleId,
  resource: string,
  payload: Record<string, string>
) =>
  request(() =>
    moduleFormsApi.post<ModuleFormRecord>(resourcePath(module, resource), { payload })
      .then((response) => response.data)
  )

export const updateModuleFormRecord = (
  module: ModuleId,
  resource: string,
  id: string,
  payload: Record<string, string>
) =>
  request(() =>
    moduleFormsApi.put<ModuleFormRecord>(
      `${resourcePath(module, resource)}/${encodeURIComponent(id)}`,
      { payload }
    ).then((response) => response.data)
  )

export const deleteModuleFormRecord = (module: ModuleId, resource: string, id: string) =>
  request(() =>
    moduleFormsApi.delete(`${resourcePath(module, resource)}/${encodeURIComponent(id)}`)
  )

export const getModuleFormLookups = (module: ModuleId, resource: string) =>
  request(() =>
    moduleFormsApi
      .get<ModuleFormLookup[]>(
        `/api/v1/module-forms/${encodeURIComponent(module)}/lookups/${encodeURIComponent(resource)}`
      )
      .then((response) => response.data)
  )

export const uploadModuleFormFile = (file: File) =>
  request(() => {
    const formData = new FormData()
    formData.append('file', file)
    return moduleFormsApi
      .post<{ path: string }>('/api/v1/module-forms/gl/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      .then((response) => response.data)
  })
