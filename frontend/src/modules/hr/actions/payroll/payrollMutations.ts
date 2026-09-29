import type {
  PayrollCalculationResult,
  PayrollFormData,
} from '../../types/payrollTypes'

const API_URL = 'http://127.0.0.1:8000/payroll'

export const calculatePayroll = async (
  data: PayrollFormData,
): Promise<PayrollCalculationResult> => {
  const response = await fetch(`${API_URL}/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result?.detail || 'Payroll calculation failed',
    )
  }

  return result
}

export const createPayroll = async (
  data: PayrollFormData,
) => {
  const response = await fetch(`${API_URL}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result?.detail || 'Failed to create payroll',
    )
  }

  return result
}