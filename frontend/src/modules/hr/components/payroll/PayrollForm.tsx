import { useState } from 'react'
import { z } from 'zod'
import * as XLSX from 'xlsx'
import {
  Alert,
  Button,
  Grid,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import {
  calculatePayroll,
  createPayroll,
} from '../../actions/payroll/payrollMutations'
import type {
  PayrollCalculationResult,
  PayrollFormData,
} from '../../types/payrollTypes'
import { formatPayrollCurrency } from '../../utils/payrollDisplayUtils'
import HRBackButton from '../HRBackButton'

const payrollExcelSchema = z.object({
  basic_salary: z.number().finite().min(0, 'Must be zero or greater'),
  allowances: z.number().finite().min(0, 'Must be zero or greater'),
  other_income: z.number().finite().min(0, 'Must be zero or greater'),
  tds: z.number().finite().min(0, 'Must be zero or greater'),
  other_deductions: z.number().finite().min(0, 'Must be zero or greater'),
})

const payrollExcelHeaders = Object.keys(
  payrollExcelSchema.shape,
) as (keyof PayrollFormData)[]

type PayrollExcelRow = {
  rowNumber: number
  data: PayrollFormData
  result?: PayrollCalculationResult
  error?: string
}

function normalizeExcelHeader(value: unknown) {
  return String(value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_')
}

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
  const [excelRows, setExcelRows] = useState<PayrollExcelRow[]>([])
  const [excelError, setExcelError] = useState('')
  const [excelLoading, setExcelLoading] = useState(false)
  const [excelSaveSuccess, setExcelSaveSuccess] = useState('')

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

  const handleExcelSelect = async (file?: File) => {
    setExcelRows([])
    setExcelError('')
    if (!file) return
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setExcelError('Select an Excel file (.xlsx or .xls).')
      return
    }

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), {
        type: 'array',
        cellDates: true,
      })
      const sheetName = workbook.SheetNames[0]
      const sheet = sheetName ? workbook.Sheets[sheetName] : undefined
      if (!sheet) throw new Error('Excel worksheet not found.')

      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: '',
        raw: true,
      })
      if (rows.length < 2) throw new Error('Excel file has no data rows.')

      const headers = rows[0].map(normalizeExcelHeader)
      const duplicateHeaders = headers.filter(
        (header, index) => header && headers.indexOf(header) !== index,
      )
      if (duplicateHeaders.length) {
        throw new Error(
          `Duplicate Excel columns: ${[...new Set(duplicateHeaders)].join(', ')}.`,
        )
      }

      const missingHeaders = ['basic_salary'].filter(
        (header) => !headers.includes(header),
      )
      const unsupportedHeaders = headers.filter(
        (header) => header && !payrollExcelHeaders.some((supported) => supported === header),
      )
      if (missingHeaders.length || unsupportedHeaders.length) {
        throw new Error([
          ...(missingHeaders.length
            ? [`Missing required columns: ${missingHeaders.join(', ')}`]
            : []),
          ...(unsupportedHeaders.length
            ? [`Unsupported columns: ${unsupportedHeaders.join(', ')}`]
            : []),
        ].join('. '))
      }

      const parsedRows: PayrollExcelRow[] = []
      const rowErrors: string[] = []
      rows.slice(1).forEach((cells, index) => {
        if (cells.every((value) => value === '' || value == null)) return
        const candidate = Object.fromEntries(
          payrollExcelHeaders.map((header) => {
            const columnIndex = headers.indexOf(header)
            const value = columnIndex < 0 ? '' : cells[columnIndex]
            return [
              header,
              value === '' || value == null ? 0 : Number(value),
            ]
          }),
        )
        const parsed = payrollExcelSchema.safeParse(candidate)
        if (!parsed.success) {
          rowErrors.push(
            `Row ${index + 2}: ${parsed.error.issues
              .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
              .join(', ')}`,
          )
          return
        }
        parsedRows.push({
          rowNumber: index + 2,
          data: parsed.data,
        })
      })

      if (!parsedRows.length && !rowErrors.length) {
        throw new Error('Excel file has no non-empty data rows.')
      }
      setExcelRows(parsedRows)
      setExcelError(rowErrors.join('\n'))
    } catch (error) {
      setExcelRows([])
      setExcelError(
        error instanceof Error ? error.message : 'Unable to read Excel file.',
      )
    }
  }

  const saveExcelRows = async () => {
    const rowsToSave = excelRows.filter((row) => !row.result)
    if (excelLoading || !rowsToSave.length || excelError) return
    setExcelLoading(true)
    setExcelError('')
    setExcelSaveSuccess('')
    try {
      const resultsByRow = new Map(
        excelRows
          .filter((row) => row.result)
          .map((row) => [row.rowNumber, row]),
      )
      const savedRows: number[] = []
      for (const row of rowsToSave) {
        try {
          const saved = await createPayroll(row.data)
          savedRows.push(row.rowNumber)
          resultsByRow.set(row.rowNumber, {
            ...row,
            result: saved,
            error: undefined,
          })
        } catch (error) {
          resultsByRow.set(row.rowNumber, {
            ...row,
            error: error instanceof Error
              ? error.message
              : 'Payroll calculation failed.',
          })
        }
      }
      setExcelRows(
        excelRows.map((row) => resultsByRow.get(row.rowNumber) ?? row),
      )
      if (savedRows.length) {
        setExcelSaveSuccess(
          `Payroll saved successfully for Excel row${savedRows.length === 1 ? '' : 's'} ${savedRows.join(', ')}.`,
        )
      }
    } finally {
      setExcelLoading(false)
    }
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
        <Snackbar
          open={Boolean(excelSaveSuccess)}
          autoHideDuration={6000}
          onClose={() => setExcelSaveSuccess('')}
        >
          <Alert
            severity="success"
            onClose={() => setExcelSaveSuccess('')}
          >
            {excelSaveSuccess}
          </Alert>
        </Snackbar>
        <div>
          <Typography variant="h5">
            Payroll
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

        <div className="d-flex justify-content-end gap-2">
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
          >
            {loading
              ? 'Calculating...'
              : 'Calculate Payroll'}
          </Button>
          <HRBackButton />
        </div>

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

        <Stack spacing={2}>
          <Typography variant="h6">Upload Excel</Typography>
          <input
            type="file"
            accept=".xlsx,.xls"
            className="form-control"
            disabled={excelLoading}
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              void handleExcelSelect(file)
            }}
          />
          {excelError && (
            <Alert severity="error" sx={{ whiteSpace: 'pre-line' }}>
              {excelError}
            </Alert>
          )}
          {excelRows.length > 0 && (
            <>
              <Typography variant="subtitle1">
                Excel Preview ({excelRows.length} rows)
              </Typography>
              <div className="table-responsive">
                <table className="table table-bordered table-sm">
                  <thead>
                    <tr>
                      <th>Row</th>
                      {payrollExcelHeaders.map((header) => (
                        <th key={header}>{header}</th>
                      ))}
                      <th>Net Salary</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {excelRows.map((row) => (
                      <tr key={row.rowNumber}>
                        <td>{row.rowNumber}</td>
                        {payrollExcelHeaders.map((header) => (
                          <td key={header}>{row.data[header]}</td>
                        ))}
                        <td>
                          {row.result
                            ? formatPayrollCurrency(row.result.net_salary)
                            : ''}
                        </td>
                        <td>{row.error ?? (row.result ? 'Calculated' : 'Ready')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button
                type="button"
                variant="contained"
                disabled={
                  excelLoading ||
                  Boolean(excelError) ||
                  !excelRows.some((row) => !row.result)
                }
                onClick={() => void saveExcelRows()}
              >
                {excelLoading ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </Stack>
      </Stack>
    </Paper>
  )
}

export default PayrollForm