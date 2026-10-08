import apiClient from '../../../services/apiClient'
import type { InventoryRecord } from '../types/inventoryTypes'

const isRecord = (value: unknown): value is InventoryRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export async function getInventoryCollection(
  endpoint: string,
): Promise<InventoryRecord[]> {
  const response = await apiClient.get<unknown>(endpoint)

  if (!Array.isArray(response.data)) {
    throw new Error(`Expected an array response from ${endpoint}.`)
  }

  if (!response.data.every(isRecord)) {
    throw new Error(`The response from ${endpoint} contains invalid records.`)
  }

  return response.data
}

export async function createInventoryRecord(
  endpoint: string,
  payload: Record<string, string | number | boolean>,
): Promise<InventoryRecord> {
  const response = await apiClient.post<unknown>(endpoint, payload)

  if (!isRecord(response.data)) {
    throw new Error(`Expected a record response from ${endpoint}.`)
  }

  return response.data
}
