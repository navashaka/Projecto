import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Button,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import * as XLSX from 'xlsx'
import apiClient from '../../../../services/apiClient'
import HRBackButton from '../HRBackButton'

const optionalText = (max: number, label: string) =>
  z.string().trim().max(max, `${label} must be ${max} characters or less`)
    .optional().or(z.literal(''))

const optionalDate = z.string().refine((value) => {
  if (!value) return true
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
}, 'Enter a valid date').optional().or(z.literal(''))

const schema = z.object({
  user_id: z.number().int().positive('Enter a valid User ID'),
  employee_code: optionalText(100, 'Employee code'),
  designation: optionalText(150, 'Designation'),
  department: optionalText(150, 'Department'),
  immediate_reporting_head: optionalText(150, 'Immediate reporting head'),
  department_head: optionalText(150, 'Department head'),
  location: optionalText(150, 'Location'),
  epf_uan: optionalText(100, 'EPF UAN'),
  esi: optionalText(100, 'ESI'),
  health_insurance: optionalText(100, 'Health insurance'),
  health_insurance_date: optionalDate,
  work_email: z.string().trim()
    .max(150, 'Work email must be 150 characters or less')
    .email('Enter a valid email').optional().or(z.literal('')),
  bank_account_name: optionalText(150, 'Bank account name'),
  account_no: optionalText(100, 'Account number'),
  bank: optionalText(150, 'Bank'),
  branch: optionalText(150, 'Branch'),
  ifsc: optionalText(50, 'IFSC'),
})

type FormData = z.infer<typeof schema>
type FieldName = Exclude<keyof FormData, 'user_id'>

const fields: { name: FieldName; label: string; maxLength: number }[] = [
  { name: 'employee_code', label: 'Employee code', maxLength: 100 },
  { name: 'designation', label: 'Designation', maxLength: 150 },
  { name: 'department', label: 'Department', maxLength: 150 },
  { name: 'immediate_reporting_head', label: 'Immediate reporting head', maxLength: 150 },
  { name: 'department_head', label: 'Department head', maxLength: 150 },
  { name: 'location', label: 'Location', maxLength: 150 },
  { name: 'epf_uan', label: 'EPF UAN', maxLength: 100 },
  { name: 'esi', label: 'ESI', maxLength: 100 },
  { name: 'health_insurance', label: 'Health insurance', maxLength: 100 },
  { name: 'health_insurance_date', label: 'Health insurance date', maxLength: 10 },
  { name: 'work_email', label: 'Work email', maxLength: 150 },
  { name: 'bank_account_name', label: 'Bank account name', maxLength: 150 },
  { name: 'account_no', label: 'Account number', maxLength: 100 },
  { name: 'bank', label: 'Bank', maxLength: 150 },
  { name: 'branch', label: 'Branch', maxLength: 150 },
  { name: 'ifsc', label: 'IFSC', maxLength: 50 },
]

const emptyForm: FormData = {
  user_id: 0,
  employee_code: '',
  designation: '',
  department: '',
  immediate_reporting_head: '',
  department_head: '',
  location: '',
  epf_uan: '',
  esi: '',
  health_insurance: '',
  health_insurance_date: '',
  work_email: '',
  bank_account_name: '',
  account_no: '',
  bank: '',
  branch: '',
  ifsc: '',
}

type ExcelRowResult =
  | { data: FormData }
  | { row: number; errors: string[] }

function EmploymentDetailsForm() {
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [severity, setSeverity] = useState<'success' | 'error'>('success')
  const [preview, setPreview] = useState<FormData[]>([])
  const [excelErrors, setExcelErrors] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: emptyForm,
  })

  const uploadExcel = async (file?: File) => {
    setPreview([])
    setExcelErrors([])
    setMessage('')
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setExcelErrors(['Select an .xlsx file.'])
      return
    }

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { cellDates: true })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      if (!sheet) throw new Error('Excel sheet is empty.')

      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: '',
        raw: false,
      })
      if (!rows.length) throw new Error('Excel file has no data rows.')

      const results: ExcelRowResult[] = rows.map((row, index) => {
        const values: Record<string, unknown> = {}
        Object.entries(row).forEach(([key, value]) => {
          values[key.trim().toLowerCase()] = value
        })

        const candidate: Record<string, unknown> = { ...emptyForm }
        candidate.user_id = Number(values.user_id)
        fields.forEach(({ name }) => {
          candidate[name] = values[name] == null ? '' : String(values[name]).trim()
        })

        const result = schema.safeParse(candidate)
        if (!result.success) {
          return {
            row: index + 2,
            errors: result.error.issues.map((issue) => issue.message),
          }
        }
        return { data: result.data }
      })

      const invalidRows = results.filter(
        (item): item is Extract<ExcelRowResult, { row: number }> => 'row' in item,
      )
      const validRows = results.flatMap((item) =>
        'data' in item ? [item.data] : [],
      )

      setExcelErrors(
        invalidRows.map((item) => `Row ${item.row}: ${item.errors.join(', ')}`),
      )
      setPreview(validRows)

      if (validRows.length) {
        setMessage(`${validRows.length} valid row(s) ready for preview.`)
        setSeverity(invalidRows.length ? 'error' : 'success')
      }
    } catch (error) {
      setExcelErrors([
        error instanceof Error ? error.message : 'Unable to read Excel file.',
      ])
    }
  }

  const saveRows = async (rows: FormData[]) => {
    if (!rows.length || excelErrors.length) return

    setSaving(true)
    setMessage('')
    let savedCount = 0
    const failures: string[] = []

    try {
      for (let index = 0; index < rows.length; index++) {
        try {
          const row = rows[index]
          await apiClient.post('/api/v1/employment/', {
            ...row,
            health_insurance_date: row.health_insurance_date || null,
            work_email: row.work_email || null,
          })
          savedCount++
        } catch (error) {
          const err = error as {
            response?: {
              data?: { detail?: string | { msg?: string }[] }
            }
          }
          const detail = err.response?.data?.detail
          const reason = Array.isArray(detail)
            ? detail.map((item) => item.msg ?? 'Validation error').join(', ')
            : detail
          failures.push(`Row ${index + 1}: ${reason ?? 'Save failed'}`)
        }
      }

      setSeverity(failures.length ? 'error' : 'success')
      setMessage(
        failures.length
          ? `${savedCount} saved. ${failures.join('; ')}`
          : `${savedCount} employment record(s) saved successfully.`,
      )
    } finally {
      setSaving(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    setExcelErrors([])
    await saveRows([data])
  }

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{ p: { xs: 2, md: 4 } }}
    >
      <Stack spacing={3}>
        <Typography variant="h5">Employment Details</Typography>

        {message && <Alert severity={severity}>{message}</Alert>}

        <Typography variant="h6">Employment Information</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              {...register('user_id', { valueAsNumber: true })}
              label="User ID"
              placeholder="Enter user ID"
              type="number"
              required
              error={!!errors.user_id}
              helperText={errors.user_id?.message}
              fullWidth
            />
          </Grid>

          {fields.slice(0, 9).map(({ name, label, maxLength }) => (
            <Grid key={name} size={{ xs: 12, sm: 6 }}>
              <TextField
                {...register(name)}
                label={label}
                placeholder={`Enter ${label.toLowerCase()}`}
                error={!!errors[name]}
                helperText={errors[name]?.message}
                slotProps={{ htmlInput: { maxLength } }}
                fullWidth
              />
            </Grid>
          ))}

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              {...register('health_insurance_date')}
              label="Health insurance date"
              placeholder="YYYY-MM-DD"
              type="date"
              error={!!errors.health_insurance_date}
              helperText={errors.health_insurance_date?.message}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              {...register('work_email')}
              label="Work email"
              placeholder="Enter work email"
              type="email"
              error={!!errors.work_email}
              helperText={errors.work_email?.message}
              fullWidth
            />
          </Grid>
        </Grid>

        <Typography variant="h6">Bank Information</Typography>
        <Grid container spacing={2}>
          {fields.slice(11).map(({ name, label, maxLength }) => (
            <Grid key={name} size={{ xs: 12, sm: 6 }}>
              <TextField
                {...register(name)}
                label={label}
                placeholder={`Enter ${label.toLowerCase()}`}
                error={!!errors[name]}
                helperText={errors[name]?.message}
                slotProps={{ htmlInput: { maxLength } }}
                fullWidth
              />
            </Grid>
          ))}
        </Grid>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'flex-end' }}
        >
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save Form'}
          </Button>
          <Button
            type="button"
            variant="outlined"
            disabled={saving}
            onClick={() => {
              reset(emptyForm)
              setMessage('')
              setExcelErrors([])
              setPreview([])
            }}
          >
            Clear
          </Button>
          <HRBackButton />
        </Stack>

        <Typography variant="h6">Upload Excel</Typography>
        <Button component="label" variant="outlined">
          Choose Excel File (.xlsx)
          <input
            hidden
            type="file"
            accept=".xlsx"
            onChange={(event) => {
              void uploadExcel(event.target.files?.[0])
              event.target.value = ''
            }}
          />
        </Button>

        {excelErrors.length > 0 && (
          <Alert severity="error">
            {excelErrors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </Alert>
        )}

        {preview.length > 0 && (
          <>
            <Typography variant="h6">
              Excel Preview ({preview.length} rows)
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>User ID</TableCell>
                    <TableCell>Employee Code</TableCell>
                    <TableCell>Designation</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Work Email</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.map((row, index) => (
                    <TableRow key={`${row.user_id}-${index}`}>
                      <TableCell>{row.user_id}</TableCell>
                      <TableCell>{row.employee_code}</TableCell>
                      <TableCell>{row.designation}</TableCell>
                      <TableCell>{row.department}</TableCell>
                      <TableCell>{row.work_email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Button
              type="button"
              variant="contained"
              disabled={saving || excelErrors.length > 0}
              onClick={() => void saveRows(preview)}
            >
              {saving ? 'Saving...' : 'Save Excel Records'}
            </Button>
          </>
        )}
      </Stack>
    </Paper>
  )
}

export default EmploymentDetailsForm