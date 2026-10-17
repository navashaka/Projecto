import apiClient from '../../../services/apiClient'
import type { ARRecord } from '../types/arTypes'

const prefix = '/ar'

export async function listARRecords(resource: string): Promise<ARRecord[]> {
  const response = await apiClient.get<ARRecord[]>(`${prefix}/${resource}`)
  return response.data
}

export async function getARRecord(
  resource: string,
  recordId: number,
): Promise<ARRecord> {
  const response = await apiClient.get<ARRecord>(
    `${prefix}/${resource}/${recordId}`,
  )
  return response.data
}

export async function saveARRecord(
  resource: string,
  values: Record<string, unknown>,
  recordId?: number,
): Promise<ARRecord> {
  const url = `${prefix}/${resource}${recordId === undefined ? '' : `/${recordId}`}`
  const response = recordId === undefined
    ? await apiClient.post<ARRecord>(url, values)
    : await apiClient.patch<ARRecord>(url, values)
  return response.data
}

export async function deleteARRecord(
  resource: string,
  recordId: number,
): Promise<void> {
  await apiClient.delete(`${prefix}/${resource}/${recordId}`)
}

export function formatARError(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    'detail' in error.response.data
  ) {
    const detail = error.response.data.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail
        .map((item) => (
          typeof item === 'object' &&
          item !== null &&
          'msg' in item &&
          typeof item.msg === 'string'
            ? item.msg
            : ''
        ))
        .filter(Boolean)
        .join('; ')
    }
  }
  return error instanceof Error ? error.message : fallback
}
