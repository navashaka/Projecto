import { useState } from 'react'
import type {
  PayrollCalculationResult,
  PayrollFormData,
} from '../types/payrollTypes'

export const usePayroll = () => {
  const [calculation, setCalculation] =
    useState<PayrollCalculationResult | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const calculatePayroll = async (
    data: PayrollFormData,
  ) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/payroll/calculate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        },
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result?.detail || 'Payroll calculation failed',
        )
      }

      setCalculation(result)

      return result
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong'

      setError(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    calculation,
    loading,
    error,
    calculatePayroll,
  }
}