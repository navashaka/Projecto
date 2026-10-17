import { useCallback, useEffect, useState } from 'react'
import { formatARError, listARRecords } from '../services/arApi'
import type { ARRecord } from '../types/arTypes'

export function useARRecords(resource: string) {
  const [records, setRecords] = useState<ARRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      setRecords(await listARRecords(resource))
      setError('')
      return true
    } catch (loadError) {
      setError(formatARError(loadError, `Unable to load ${resource}.`))
      return false
    } finally {
      setLoading(false)
    }
  }, [resource])

  useEffect(() => {
    let active = true
    const loadInitial = async () => {
      try {
        const initialRecords = await listARRecords(resource)
        if (active) {
          setRecords(initialRecords)
          setError('')
        }
      } catch (loadError) {
        if (active) {
          setError(formatARError(loadError, `Unable to load ${resource}.`))
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadInitial()
    return () => {
      active = false
    }
  }, [resource])

  return { records, loading, error, reload, setError }
}
