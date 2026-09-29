import { useState } from 'react'
import {
  Alert,
  Button,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import { calculatePayroll } from '../../actions/payroll/payrollMutations'
import type {
  PayrollCalculationResult,
  PayrollFormData,
} from '../../types/payrollTypes'
import { formatPayrollCurrency } from '../../utils/payrollDisplayUtils'

function PayrollForm() {
  const [formData, setFormData] = useState<PayrollFormData>({
    basic_salary: 0,
    allowances: 0,
    other_income: 0,
    tds: 0,
    other_deductions: 0,
  })

  const [result, setResult] =
    useState<PayrollCalculationResult | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (
    field: keyof PayrollFormData,
    value: string,
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value === '' ? 0 : Number(value),
    }))
  }

  const displayValue = (
    value: number,
  ): string | number => {
    return value === 0 ? '' : value
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const calculation = await calculatePayroll(formData)

      setResult(calculation)
      setSuccess('Payroll calculated successfully!')
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Payroll calculation failed',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: { xs: 2, md: 4 },
        maxWidth: 900,
        mx: 'auto',
        mt: 4,
      }}
    >
      <Stack spacing={3}>
        <div>
          <Typography variant="h5">
            Payroll
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Enter salary details and calculate payroll.
          </Typography>
        </div>

        {success && (
          <Alert severity="success">
            {success}
          </Alert>
        )}

        {error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}

        <Typography variant="h6">
          Salary Inputs
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Basic Salary"
              type="number"
              value={displayValue(formData.basic_salary)}
              onChange={(event) =>
                handleChange(
                  'basic_salary',
                  event.target.value,
                )
              }
              slotProps={{
                htmlInput: {
                  min: 0,
                  step: '0.01',
                },
              }}
              fullWidth
              required
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Allowances"
              type="number"
              value={displayValue(formData.allowances)}
              onChange={(event) =>
                handleChange(
                  'allowances',
                  event.target.value,
                )
              }
              slotProps={{
                htmlInput: {
                  min: 0,
                  step: '0.01',
                },
              }}
              fullWidth
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Other Income"
              type="number"
              value={displayValue(formData.other_income)}
              onChange={(event) =>
                handleChange(
                  'other_income',
                  event.target.value,
                )
              }
              slotProps={{
                htmlInput: {
                  min: 0,
                  step: '0.01',
                },
              }}
              fullWidth
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="TDS"
              type="number"
              value={displayValue(formData.tds)}
              onChange={(event) =>
                handleChange(
                  'tds',
                  event.target.value,
                )
              }
              slotProps={{
                htmlInput: {
                  min: 0,
                  step: '0.01',
                },
              }}
              fullWidth
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Other Deductions"
              type="number"
              value={displayValue(
                formData.other_deductions,
              )}
              onChange={(event) =>
                handleChange(
                  'other_deductions',
                  event.target.value,
                )
              }
              slotProps={{
                htmlInput: {
                  min: 0,
                  step: '0.01',
                },
              }}
              fullWidth
            />
          </Grid>
        </Grid>

        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          sx={{ alignSelf: 'flex-start' }}
        >
          {loading
            ? 'Calculating...'
            : 'Calculate Payroll'}
        </Button>

        {result && (
          <>
            <Typography variant="h6">
              Payroll Calculation
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Gross Salary"
                  value={formatPayrollCurrency(
                    result.gross_salary,
                  )}
                  fullWidth
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Employee EPF"
                  value={formatPayrollCurrency(
                    result.employee_epf,
                  )}
                  fullWidth
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Employee ESI"
                  value={formatPayrollCurrency(
                    result.employee_esi,
                  )}
                  fullWidth
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Total Deductions"
                  value={formatPayrollCurrency(
                    result.total_deductions,
                  )}
                  fullWidth
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Net Salary"
                  value={formatPayrollCurrency(
                    result.net_salary,
                  )}
                  fullWidth
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>
            </Grid>
          </>
        )}
      </Stack>
    </Paper>
  )
}

export default PayrollForm