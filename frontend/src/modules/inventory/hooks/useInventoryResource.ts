import { useCallback, useEffect, useState } from 'react'
import { getInventoryCollection } from '../actions/inventoryActions'
import type {
  InventoryFieldDefinition,
  InventoryRecord,
  InventoryResourceDefinition,
} from '../types/inventoryTypes'
import { formatInventoryError } from '../utils/inventoryFormUtils'

function getOptionFields(
  resource: InventoryResourceDefinition,
): InventoryFieldDefinition[] {
  const fields = [
    ...resource.fields,
    ...(resource.items?.fields ?? []),
  ]

  return fields.filter(
    (field) => field.optionsEndpoint !== undefined,
  )
}

export function useInventoryResource(resource: InventoryResourceDefinition) {
  const [records, setRecords] = useState<InventoryRecord[]>([])
  const [itemRecords, setItemRecords] = useState<InventoryRecord[]>([])
  const [options, setOptions] = useState<
    Record<string, InventoryRecord[]>
  >({})
  const [loading, setLoading] = useState(true)
  const [dataError, setDataError] = useState('')

  const reloadRecords = useCallback(async () => {
    try {
      const collectionResults = await Promise.allSettled([
        getInventoryCollection(resource.endpoint),
        ...(resource.items
          ? [getInventoryCollection(resource.items.endpoint)]
          : []),
      ])
      const mainResult = collectionResults[0]

      if (!mainResult || mainResult.status === 'rejected') {
        throw mainResult?.reason ??
          new Error(`Unable to load ${resource.endpoint}.`)
      }

      setRecords(mainResult.value)
      if (resource.items) {
        const itemResult = collectionResults[1]
        if (itemResult?.status === 'fulfilled') {
          setItemRecords(itemResult.value)
          setDataError('')
        } else {
          setDataError(
            formatInventoryError(
              itemResult?.reason,
              `Unable to load ${resource.items.endpoint}.`,
            ),
          )
        }
      } else {
        setDataError('')
      }

      return true
    } catch (error) {
      setDataError(
        formatInventoryError(
          error,
          `Unable to load ${resource.label.toLowerCase()} records.`,
        ),
      )
      return false
    }
  }, [resource.endpoint, resource.items, resource.label])

  const loadAll = useCallback(async () => {
    const optionEndpoints = [
      ...new Set(
        getOptionFields(resource).flatMap((field) =>
          field.optionsEndpoint ? [field.optionsEndpoint] : [],
        ),
      ),
    ]
    const collectionEndpoints = [
      resource.endpoint,
      ...(resource.items ? [resource.items.endpoint] : []),
    ]
    const endpoints = [
      ...new Set([...collectionEndpoints, ...optionEndpoints]),
    ]

    try {
      const results = await Promise.allSettled(
        endpoints.map((endpoint) => getInventoryCollection(endpoint)),
      )
      const resultByEndpoint = new Map(
        endpoints.map((endpoint, index) => [endpoint, results[index]]),
      )

      const resourceResult = resultByEndpoint.get(resource.endpoint)
      if (!resourceResult || resourceResult.status === 'rejected') {
        throw resourceResult?.reason ??
          new Error(`Unable to load ${resource.endpoint}.`)
      }

      setRecords(resourceResult.value)
      const nextOptions: Record<string, InventoryRecord[]> = {}
      const optionErrors: string[] = []

      if (resource.items) {
        const itemResult = resultByEndpoint.get(resource.items.endpoint)
        if (itemResult?.status === 'fulfilled') {
          setItemRecords(itemResult.value)
        } else {
          optionErrors.push(
            `${resource.items.endpoint}: ${formatInventoryError(
              itemResult?.reason,
              'Unable to load item records.',
            )}`,
          )
        }
      }

      optionEndpoints.forEach((endpoint) => {
        const result = resultByEndpoint.get(endpoint)
        if (result?.status === 'fulfilled') {
          nextOptions[endpoint] = result.value
        } else {
          optionErrors.push(
            `${endpoint}: ${formatInventoryError(
              result?.reason,
              'Unable to load referenced records.',
            )}`,
          )
        }
      })

      setOptions(nextOptions)
      setDataError(optionErrors.join('; '))
    } catch (error) {
      setDataError(
        formatInventoryError(
          error,
          `Unable to load ${resource.label.toLowerCase()} data.`,
        ),
      )
    } finally {
      setLoading(false)
    }
  }, [resource])

  const retryLoad = useCallback(async () => {
    setLoading(true)
    setDataError('')
    await loadAll()
  }, [loadAll])

  useEffect(() => {
    void Promise.resolve().then(loadAll)
  }, [loadAll])

  return {
    records,
    itemRecords,
    options,
    loading,
    dataError,
    reloadRecords,
    retryLoad,
  }
}
