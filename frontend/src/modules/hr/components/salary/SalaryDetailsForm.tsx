import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import * as XLSX from 'xlsx'
import HRBackButton from '../HRBackButton'

const SALARY_API_URL = 'http://127.0.0.1:8000/salary-details/'
const PAGE_SIZE = 10

type SalaryRecord = {
  id: number
  user_id: number
  effective_date: string | null
  net_salary: number | string | null
  total_ctc: number | string | null
}

const isValidDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

const toExcelDate = (value: unknown) => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return 'Invalid date'
    return value.toISOString().slice(0, 10)
  }

  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value)
    if (!date) return 'Invalid date'
    return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`
  }

  return String(value ?? '').trim()
}

const decimalSchema = (label: string) =>
  z.number()
    .finite(`${label} must be a valid number`)
    .refine(
      (value) => Math.abs(value) <= 9999999999.99,
      `${label} must fit Numeric(12, 2)`,
    )
    .optional()

const optionalInteger = (label: string) =>
  z.number().int(`${label} must be a whole number`).optional()

const salaryDetailsSchema = z.object({
  user_id: z
    .number()
    .int('User ID must be a whole number')
    .positive('User ID must be positive'),
  effective_date: z
    .string()
    .min(1, 'Effective date is required')
    .refine(isValidDate, 'Enter a valid effective date'),
  salary_offered_ctc: decimalSchema('Salary offered CTC'),
  yearly_increment: decimalSchema('Yearly increment'),
  increment_year: optionalInteger('Increment year'),
  basic: decimalSchema('Basic'),
  allowance1: decimalSchema('Allowance 1'),
  allowance2: decimalSchema('Allowance 2'),
  allowance3: decimalSchema('Allowance 3'),
  allowance4: decimalSchema('Allowance 4'),
  allowance5: decimalSchema('Allowance 5'),
  allowance6: decimalSchema('Allowance 6'),
  other_allowance: decimalSchema('Other allowance'),
  arrears: decimalSchema('Arrears'),
  gross: decimalSchema('Gross'),
  epf_deduction: decimalSchema('EPF deduction'),
  esi_insurance_deduction: decimalSchema('ESI insurance deduction'),
  tds: decimalSchema('TDS'),
  canteen_deduction: decimalSchema('Canteen deduction'),
  advance_deduction: decimalSchema('Advance deduction'),
  loan_emi: decimalSchema('Loan EMI'),
  other_deduction: decimalSchema('Other deduction'),
  total_deductions: decimalSchema('Total deductions'),
  net_salary: decimalSchema('Net salary'),
  epf_employer_share: decimalSchema('EPF employer share'),
  esi_employer_share: decimalSchema('ESI employer share'),
  insurance_employer_share: decimalSchema('Insurance employer share'),
  transport_allowance: decimalSchema('Transport allowance'),
  canteen_allowance: decimalSchema('Canteen allowance'),
  bonus: decimalSchema('Bonus'),
  other_employer_contribution: decimalSchema('Other employer contribution'),
  total_ctc: decimalSchema('Total CTC'),
})

type SalaryDetailsFormData = z.infer<typeof salaryDetailsSchema>
type SalaryFieldName = Exclude<keyof SalaryDetailsFormData, 'effective_date'>

type NumericField = {
  name: SalaryFieldName
  label: string
  integer?: boolean
  calculated?: boolean
}

const numericFields: NumericField[] = [
  { name: 'salary_offered_ctc', label: 'Salary Offered CTC' },
  { name: 'yearly_increment', label: 'Yearly Increment' },
  { name: 'increment_year', label: 'Increment Year', integer: true },
  { name: 'basic', label: 'Basic' },
  { name: 'allowance1', label: 'Allowance 1' },
  { name: 'allowance2', label: 'Allowance 2' },
  { name: 'allowance3', label: 'Allowance 3' },
  { name: 'allowance4', label: 'Allowance 4' },
  { name: 'allowance5', label: 'Allowance 5' },
  { name: 'allowance6', label: 'Allowance 6' },
  { name: 'other_allowance', label: 'Other Allowance' },
  { name: 'arrears', label: 'Arrears' },
  { name: 'gross', label: 'Gross', calculated: true },
  { name: 'epf_deduction', label: 'EPF Deduction', calculated: true },
  { name: 'esi_insurance_deduction', label: 'ESI Insurance Deduction', calculated: true },
  { name: 'tds', label: 'TDS' },
  { name: 'canteen_deduction', label: 'Canteen Deduction' },
  { name: 'advance_deduction', label: 'Advance Deduction' },
  { name: 'loan_emi', label: 'Loan EMI' },
  { name: 'other_deduction', label: 'Other Deduction' },
  { name: 'total_deductions', label: 'Total Deductions', calculated: true },
  { name: 'net_salary', label: 'Net Salary', calculated: true },
  { name: 'epf_employer_share', label: 'EPF Employer Share', calculated: true },
  { name: 'esi_employer_share', label: 'ESI Employer Share', calculated: true },
  { name: 'insurance_employer_share', label: 'Insurance Employer Share' },
  { name: 'transport_allowance', label: 'Transport Allowance' },
  { name: 'canteen_allowance', label: 'Canteen Allowance' },
  { name: 'bonus', label: 'Bonus' },
  { name: 'other_employer_contribution', label: 'Other Employer Contribution' },
  { name: 'total_ctc', label: 'Total CTC', calculated: true },
]

const excelHeaders = [
  'user_id',
  'effective_date',
  ...numericFields.map((field) => field.name),
]

const emptyValues: SalaryDetailsFormData = {
  user_id: undefined as unknown as number,
  effective_date: '',
  salary_offered_ctc: undefined,
  yearly_increment: undefined,
  increment_year: undefined,
  basic: undefined,
  allowance1: undefined,
  allowance2: undefined,
  allowance3: undefined,
  allowance4: undefined,
  allowance5: undefined,
  allowance6: undefined,
  other_allowance: undefined,
  arrears: undefined,
  gross: undefined,
  epf_deduction: undefined,
  esi_insurance_deduction: undefined,
  tds: undefined,
  canteen_deduction: undefined,
  advance_deduction: undefined,
  loan_emi: undefined,
  other_deduction: undefined,
  total_deductions: undefined,
  net_salary: undefined,
  epf_employer_share: undefined,
  esi_employer_share: undefined,
  insurance_employer_share: undefined,
  transport_allowance: undefined,
  canteen_allowance: undefined,
  bonus: undefined,
  other_employer_contribution: undefined,
  total_ctc: undefined,
}

const getValue = (value: number | undefined) => value ?? 0
const roundValue = (value: number) => Math.round(value * 100) / 100

function SalaryDetailsForm() {
  const [submitMessage, setSubmitMessage] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [excelRows, setExcelRows] = useState<Record<string, unknown>[]>([])
  const [excelFileName, setExcelFileName] = useState('')
  const [excelError, setExcelError] = useState('')
  const [savingExcel, setSavingExcel] = useState(false)
  const [records, setRecords] = useState<SalaryRecord[]>([])
  const [recordsError, setRecordsError] = useState('')
  const [loadingRecords, setLoadingRecords] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SalaryDetailsFormData>({
    resolver: zodResolver(salaryDetailsSchema),
    mode: 'onChange',
    defaultValues: emptyValues,
  })

  const values = useWatch({ control })

  const loadRecords = useCallback(async () => {
    setLoadingRecords(true)
    setRecordsError('')

    try {
      const response = await fetch(SALARY_API_URL)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          typeof result?.detail === 'string'
            ? result.detail
            : 'Unable to load salary records.',
        )
      }
      if (!Array.isArray(result)) {
        throw new Error('The API returned an invalid salary record list.')
      }

      setRecords(result)
      setCurrentPage(1)
    } catch (error) {
      setRecordsError(
        error instanceof Error
          ? error.message
          : 'Unable to load salary records.',
      )
    } finally {
      setLoadingRecords(false)
    }
  }, [])

  useEffect(() => {
    void loadRecords()
  }, [loadRecords])

  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE))
  const pageRecords = records.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  useEffect(() => {
    const basic = getValue(values.basic)

    const allowances =
      getValue(values.allowance1) +
      getValue(values.allowance2) +
      getValue(values.allowance3) +
      getValue(values.allowance4) +
      getValue(values.allowance5) +
      getValue(values.allowance6) +
      getValue(values.other_allowance)

    const gross = roundValue(basic + allowances)
    const epf = roundValue(basic * 0.12)
    const esi = gross <= 21000 ? roundValue(gross * 0.0075) : 0

    const totalDeductions = roundValue(
      epf +
      esi +
      getValue(values.tds) +
      getValue(values.canteen_deduction) +
      getValue(values.advance_deduction) +
      getValue(values.loan_emi) +
      getValue(values.other_deduction),
    )

    const employerEpf = roundValue(basic * 0.0367)
    const employerEsi = gross <= 21000 ? roundValue(gross * 0.0325) : 0

    setValue('gross', gross)
    setValue('epf_deduction', epf)
    setValue('esi_insurance_deduction', esi)
    setValue('total_deductions', totalDeductions)
    setValue('net_salary', roundValue(gross - totalDeductions))
    setValue('epf_employer_share', employerEpf)
    setValue('esi_employer_share', employerEsi)

    setValue(
      'total_ctc',
      roundValue(
        gross +
        employerEpf +
        employerEsi +
        getValue(values.insurance_employer_share) +
        getValue(values.transport_allowance) +
        getValue(values.canteen_allowance) +
        getValue(values.bonus) +
        getValue(values.other_employer_contribution),
      ),
    )
  }, [
    values.basic,
    values.allowance1,
    values.allowance2,
    values.allowance3,
    values.allowance4,
    values.allowance5,
    values.allowance6,
    values.other_allowance,
    values.tds,
    values.canteen_deduction,
    values.advance_deduction,
    values.loan_emi,
    values.other_deduction,
    values.insurance_employer_share,
    values.transport_allowance,
    values.canteen_allowance,
    values.bonus,
    values.other_employer_contribution,
    setValue,
  ])

  const handleExcelUpload = async (file?: File) => {
    setExcelError('')
    setSubmitError('')
    setSubmitMessage('')
    setExcelRows([])
    setExcelFileName('')

    if (!file) return

    const extension = file.name.split('.').pop()?.toLowerCase()
    if (extension !== 'xlsx' && extension !== 'xls') {
      setExcelError('Select an Excel file (.xlsx or .xls).')
      return
    }

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), {
        type: 'array',
        cellDates: true,
      })

      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      if (!sheet) {
        setExcelError('Excel sheet not found.')
        return
      }

      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        sheet,
        { defval: '' },
      )

      if (!rawRows.length) {
        setExcelError('Excel file has no data rows.')
        return
      }

      const normalizedRows = rawRows.map((row) => {
        const normalized: Record<string, unknown> = {}
        Object.entries(row).forEach(([key, value]) => {
          normalized[key.trim().toLowerCase().replace(/\s+/g, '_')] = value
        })
        return normalized
      })

      const receivedHeaders = Object.keys(normalizedRows[0])
      const missing = excelHeaders.filter(
        (header) => !receivedHeaders.includes(header),
      )
      const unexpected = receivedHeaders.filter(
        (header) => !excelHeaders.includes(header as SalaryFieldName),
      )

      if (missing.length || unexpected.length) {
        const issues = [
          ...(missing.length ? [`Missing columns: ${missing.join(', ')}`] : []),
          ...(unexpected.length
            ? [`Unsupported columns: ${unexpected.join(', ')}`]
            : []),
        ]
        setExcelError(issues.join('. '))
        return
      }

      const rowErrors: string[] = []
      const prepared = normalizedRows.flatMap((row, index) => {
        const result: Record<string, unknown> = {}

        excelHeaders.forEach((header) => {
          const value = row[header]

          if (header === 'effective_date') {
            result[header] = toExcelDate(value)
          } else if (value === '' || value == null) {
            result[header] = undefined
          } else if (
            header === 'user_id' ||
            header === 'increment_year' ||
            numericFields.some((field) => field.name === header)
          ) {
            result[header] = Number(value)
          } else {
            result[header] = String(value).trim()
          }
        })

        const parsed = salaryDetailsSchema.safeParse(result)
        if (!parsed.success) {
          rowErrors.push(
            `Row ${index + 2}: ${parsed.error.issues
              .map((issue) => `${issue.path.join('.') || 'row'}: ${issue.message}`)
              .join(', ')}`,
          )
          return []
        }

        return [{ ...parsed.data }]
      })

      if (rowErrors.length) {
        setExcelError(rowErrors.join('\n'))
        return
      }

      setExcelRows(prepared)
      setExcelFileName(file.name)
    } catch {
      setExcelError('Excel file read cheyyalekapoyanu.')
    }
  }

  const saveSalary = async (data: Record<string, unknown>) => {
    const response = await fetch(SALARY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(
        typeof errorData?.detail === 'string'
          ? errorData.detail
          : `Save failed: ${response.status}`,
      )
    }

    await response.json().catch(() => null)
  }

  const onSubmit = async (data: SalaryDetailsFormData) => {
    setSubmitError('')
    setSubmitMessage('')

    try {
      await saveSalary(data as unknown as Record<string, unknown>)
      setSubmitMessage('Salary details saved successfully.')
      await loadRecords()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Save failed.')
    }
  }

  const saveExcelRows = async () => {
    if (savingExcel || excelRows.length === 0) return

    setSavingExcel(true)
    setExcelError('')
    setSubmitMessage('')

    try {
      let savedCount = 0
      const failedRows: Record<string, unknown>[] = []
      const failures: string[] = []

      for (let index = 0; index < excelRows.length; index++) {
        const parsed = salaryDetailsSchema.safeParse(excelRows[index])

        if (!parsed.success) {
          failedRows.push(excelRows[index])
          failures.push(
            `Row ${index + 2}: ${parsed.error.issues
              .map((issue) => `${issue.path.join('.') || 'row'}: ${issue.message}`)
              .join(', ')}`,
          )
          continue
        }

        try {
          await saveSalary(parsed.data as unknown as Record<string, unknown>)
          savedCount++
        } catch (error) {
          failedRows.push(excelRows[index])
          failures.push(
            `Row ${index + 2}: ${
              error instanceof Error ? error.message : 'Unable to save record.'
            }`,
          )
        }
      }

      if (savedCount > 0) {
        setSubmitMessage(`${savedCount} salary record(s) saved successfully.`)
        await loadRecords()
      }

      setExcelRows(failedRows)
      if (failures.length) {
        setExcelError(failures.join('\n'))
      } else {
        setExcelFileName('')
      }
    } finally {
      setSavingExcel(false)
    }
  }

  const renderRecordValue = (value: number | string | null) =>
    value == null || value === '' ? '—' : value

  const renderPageNavigation = () => (
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
      <span className="small text-muted">
        Page {currentPage} of {totalPages} · {records.length} records
      </span>
      <div className="btn-group">
        <button
          type="button"
          className="btn btn-outline-secondary"
          disabled={currentPage <= 1}
          onClick={() => setCurrentPage((page) => page - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary"
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage((page) => page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  )

  const renderField = (field: NumericField) => (
    <div className="col-12 col-md-6 col-lg-4" key={field.name}>
      <label className="form-label fw-semibold" htmlFor={field.name}>
        {field.label}
      </label>
      <input
        id={field.name}
        {...register(field.name, {
          setValueAs: (value) => value === '' ? undefined : Number(value),
        })}
        type="number"
        step={field.integer ? 1 : '0.01'}
        placeholder={`Enter ${field.label}`}
        readOnly={field.calculated}
        className={`form-control ${errors[field.name] ? 'is-invalid' : ''}`}
      />
      {errors[field.name] && (
        <div className="invalid-feedback d-block">
          {errors[field.name]?.message}
        </div>
      )}
    </div>
  )

  return (
    <div className="enquiry-page bg-light min-vh-100 py-5">
      <div className="container">
        <div className="card shadow-sm border-0">
          <div className="card-body p-4 p-lg-5">
            <h1 className="h2 mb-4">Salary Details Form</h1>

            <form className="row g-3" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="col-12 border rounded bg-white p-3 p-md-4 mb-3">
                <h2 className="h4 mb-3">Salary Information</h2>
                <div className="row g-3">
                  <div className="col-12 col-md-6 col-lg-4">
                    <label className="form-label fw-semibold" htmlFor="user_id">
                      User ID
                    </label>
                    <input
                      id="user_id"
                      {...register('user_id', { valueAsNumber: true })}
                      type="number"
                      placeholder="Enter User ID"
                      className={`form-control ${errors.user_id ? 'is-invalid' : ''}`}
                    />
                    {errors.user_id && (
                      <div className="invalid-feedback d-block">
                        {errors.user_id.message}
                      </div>
                    )}
                  </div>

                  <div className="col-12 col-md-6 col-lg-4">
                    <label className="form-label fw-semibold" htmlFor="effective_date">
                      Effective Date
                    </label>
                    <input
                      id="effective_date"
                      {...register('effective_date')}
                      type="date"
                      className={`form-control ${errors.effective_date ? 'is-invalid' : ''}`}
                    />
                    {errors.effective_date && (
                      <div className="invalid-feedback d-block">
                        {errors.effective_date.message}
                      </div>
                    )}
                  </div>

                  {numericFields.slice(0, 3).map(renderField)}
                </div>
              </div>

              <div className="col-12 border rounded bg-white p-3 p-md-4 mb-3">
                <h2 className="h4 mb-3">Salary &amp; Earnings</h2>
                <div className="row g-3">
                  {numericFields.slice(3, 13).map(renderField)}
                </div>
              </div>

              <div className="col-12 border rounded bg-white p-3 p-md-4 mb-3">
                <h2 className="h4 mb-3">Employee Deductions</h2>
                <div className="row g-3">
                  {numericFields.slice(13, 22).map(renderField)}
                </div>
              </div>

              <div className="col-12 border rounded bg-white p-3 p-md-4 mb-3">
                <h2 className="h4 mb-3">Employer Contributions</h2>
                <div className="row g-3">
                  {numericFields.slice(22).map(renderField)}
                </div>
              </div>

              <div className="col-12 border rounded bg-white p-3 p-md-4 mb-3">
                <h2 className="h4 mb-3">Upload Details</h2>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="form-control"
                  disabled={savingExcel}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    event.target.value = ''
                    void handleExcelUpload(file)
                  }}
                />

                {excelFileName && (
                  <p className="mt-2 mb-0">{excelFileName}</p>
                )}

                {excelError && (
                  <div className="text-danger mt-2">{excelError}</div>
                )}

                {excelRows.length > 0 && (
                  <>
                    <div className="table-responsive mt-3">
                      <table className="table table-bordered table-sm">
                        <thead>
                          <tr>
                            <th>#</th>
                            {excelHeaders.map((header) => (
                              <th key={header}>{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {excelRows.map((row, index) => (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              {excelHeaders.map((header) => (
                                <td key={header}>
                                  {String(row[header] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={savingExcel}
                      onClick={saveExcelRows}
                    >
                      {savingExcel ? 'Saving...' : 'Save'}
                    </button>
                  </>
                )}
              </div>

              {submitMessage && (
                <div className="col-12">
                  <div className="alert alert-success">{submitMessage}</div>
                </div>
              )}

              {submitError && (
                <div className="col-12">
                  <div className="alert alert-danger">{submitError}</div>
                </div>
              )}

              <div className="col-12 d-flex justify-content-end gap-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    reset(emptyValues)
                    setSubmitMessage('')
                    setSubmitError('')
                  }}
                >
                  Clear
                </button>

                <HRBackButton />
              </div>
            </form>

            <section className="border rounded bg-white p-3 p-md-4 mt-4">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <h2 className="h4 mb-0">Saved Salary Records</h2>
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  disabled={loadingRecords}
                  onClick={() => void loadRecords()}
                >
                  {loadingRecords ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              {recordsError && (
                <div className="alert alert-danger" role="alert">
                  {recordsError}
                </div>
              )}

              {loadingRecords ? (
                <p className="text-muted mb-0">Loading salary records...</p>
              ) : records.length === 0 ? (
                <p className="text-muted mb-0">No salary records found.</p>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>ID</th>
                          <th>User ID</th>
                          <th>Effective Date</th>
                          <th>Net Salary</th>
                          <th>Total CTC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageRecords.map((record) => (
                          <tr key={record.id}>
                            <td>{record.id}</td>
                            <td>{record.user_id}</td>
                            <td>{record.effective_date || '—'}</td>
                            <td>{renderRecordValue(record.net_salary)}</td>
                            <td>{renderRecordValue(record.total_ctc)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {renderPageNavigation()}
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SalaryDetailsForm