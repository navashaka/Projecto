import type { PayrollCalculationResult } from '../../types/payrollTypes'

const API_URL = 'http://127.0.0.1:8000/payroll'

export const getPayroll = async (
  payrollId: number,
): Promise<PayrollCalculationResult> => {
  const response = await fetch(
    `${API_URL}/${payrollId}`,
  )

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result?.detail || 'Failed to fetch payroll',
    )
  }

  return result
}