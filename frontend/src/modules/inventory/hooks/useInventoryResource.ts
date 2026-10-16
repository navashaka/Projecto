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
  const [endpointErrors, setEndpointErrors] = useState<
    Record<string, string>
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
        [
          ...getOptionFields(resource).flatMap((field) =>
            field.optionsEndpoint ? [field.optionsEndpoint] : [],
          ),
          ...(resource.relatedEndpoints ?? []),
        ],
      ),
    ]
    const collectionEndpoints = [
      resource.endpoint,
      ...(resource.items ? [resource.items.endpoint] : []),
    ]
    const endpoints = [
      ...new Set([...collectionEndpoints, ...optionEndpoints]),
    ]

    const results = await Promise.allSettled(
      endpoints.map((endpoint) => getInventoryCollection(endpoint)),
    )
    const resultByEndpoint = new Map(
      endpoints.map((endpoint, index) => [endpoint, results[index]]),
    )

    const resourceResult = resultByEndpoint.get(resource.endpoint)
    if (resourceResult?.status === 'fulfilled') {
      setRecords(resourceResult.value)
    }

    const nextOptions: Record<string, InventoryRecord[]> = {}
    const nextEndpointErrors: Record<string, string> = {}

    if (resource.items) {
      const itemResult = resultByEndpoint.get(resource.items.endpoint)
      if (itemResult?.status === 'fulfilled') {
        setItemRecords(itemResult.value)
      }
    }

    optionEndpoints.forEach((endpoint) => {
      const result = resultByEndpoint.get(endpoint)
      if (result?.status === 'fulfilled') {
        nextOptions[endpoint] = result.value
      }
    })

    endpoints.forEach((endpoint) => {
      const result = resultByEndpoint.get(endpoint)
      if (result?.status === 'rejected') {
        nextEndpointErrors[endpoint] = formatInventoryError(
          result.reason,
          `Unable to load records from ${endpoint}.`,
        )
      }
    })

    setOptions(nextOptions)
    setEndpointErrors(nextEndpointErrors)
    setDataError(
      Object.entries(nextEndpointErrors)
        .map(([endpoint, error]) => `${endpoint}: ${error}`)
        .join('; '),
    )
    setLoading(false)
  }, [resource])

  const retryLoad = useCallback(async () => {
    setLoading(true)
    setDataError('')
    await loadAll()
  }, [loadAll])

  useEffect(() => {
    void Promise.resolve().then(loadAll)
  }, [loadAll])

  useEffect(() => {
    if (
      resource.key !== 'material-receipt-notes' &&
      resource.key !== 'goods-issues'
    ) {
      return
    }

    const refreshOptions = () => {
      void loadAll()
    }

    window.addEventListener('focus', refreshOptions)
    return () => {
      window.removeEventListener('focus', refreshOptions)
    }
  }, [loadAll, resource.key])

  return {
    records,
    itemRecords,
    options,
    endpointErrors,
    loading,
    dataError,
    reloadRecords,
    retryLoad,
  }
}
