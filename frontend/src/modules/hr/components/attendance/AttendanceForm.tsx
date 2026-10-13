import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import HRBackButton from '../HRBackButton'

type ExcelRow = Record<string, unknown>

type PreviewRow = {
  employee_code: string
  attendance_month: string
  cl: number
  el: number
  pl: number
  lop: number
  nh: number
  sundays: number
  other_paid_days: number
  net_present_days: number
  net_payable_days: number
}

type AttendanceRecord = {
  id: number
  user_id: number
  attendance_month: string | null
  cl: number
  el: number
  pl: number
  lop: number
  nh: number
  sundays: number
  other_paid_days: number
  net_present_days: number
  net_payable_days: number | null
}

const API = 'http://localhost:8000'
const PAGE_SIZE = 5

function getSundaysInMonth(month: string) {
  if (!month) return 0

  const [year, monthNumber] = month.split('-').map(Number)
  const daysInMonth = new Date(year, monthNumber, 0).getDate()
  let sundays = 0

  for (let day = 1; day <= daysInMonth; day++) {
    if (new Date(year, monthNumber - 1, day).getDay() === 0) {
      sundays++
    }
  }

  return sundays
}

function toNumber(value: unknown, column: string, rowNumber: number) {
  if (value === undefined || value === null || value === '') return 0

  const number = Number(value)

  if (!Number.isInteger(number) || number < 0) {
    throw new Error(
      `Row ${rowNumber}: ${column} must be a non-negative whole number.`,
    )
  }

  return number
}

function normaliseHeader(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
}

function displayDate(value: string | null | undefined) {
  if (!value) return '—'
  return value.slice(0, 10)
}

function AttendanceForm() {
  const navigate = useNavigate()

  const [employeeCode, setEmployeeCode] = useState('')
  const [month, setMonth] = useState('')
  const [cl, setCl] = useState('0')
  const [el, setEl] = useState('0')
  const [pl, setPl] = useState('0')
  const [lop, setLop] = useState('0')
  const [otherPaidLeaves, setOtherPaidLeaves] = useState('0')
  const [nationalHolidays, setNationalHolidays] = useState(0)
  const [saving, setSaving] = useState(false)
  const [attendanceId, setAttendanceId] = useState<number | null>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([])
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  const daysInMonth = useMemo(() => {
    if (!month) return 0
    const [year, monthNumber] = month.split('-').map(Number)
    return new Date(year, monthNumber, 0).getDate()
  }, [month])

  const sundays = useMemo(() => getSundaysInMonth(month), [month])

  const netPresentDays = useMemo(
    () =>
      Math.max(
        0,
        daysInMonth -
          (Number(cl) || 0) -
          (Number(el) || 0) -
          (Number(lop) || 0) -
          nationalHolidays -
          sundays,
      ),
    [daysInMonth, cl, el, lop, nationalHolidays, sundays],
  )

  const netPayableDays = useMemo(
    () => netPresentDays + (Number(otherPaidLeaves) || 0),
    [netPresentDays, otherPaidLeaves],
  )

  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE))
  const paginatedRecords = records.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text)
    setMessageType(type)
  }

  const loadCompanyHolidays = async (selectedMonth: string) => {
    if (!selectedMonth) {
      setNationalHolidays(0)
      return
    }

    try {
      const response = await fetch(`${API}/company-holidays/`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.detail || 'Unable to load company holidays')
      }

      const count = result.filter(
        (holiday: { holiday_date: string }) =>
          holiday.holiday_date.startsWith(selectedMonth),
      ).length

      setNationalHolidays(count)
    } catch (error) {
      console.error(error)
      setNationalHolidays(0)
    }
  }

  const loadRecords = async () => {
    try {
      const response = await fetch(`${API}/attendance/`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.detail || 'Unable to load attendance records')
      }

      setRecords(Array.isArray(result) ? result : [])
      setCurrentPage(1)
    } catch (error) {
      console.error(error)
      showMessage(
        error instanceof Error
          ? error.message
          : 'Unable to load attendance records',
        'error',
      )
    }
  }

  const handleSave = async () => {
    if (!employeeCode.trim()) {
      showMessage('Please enter Employee Code.', 'error')
      return
    }

    if (!month) {
      showMessage('Please select Attendance Month.', 'error')
      return
    }

    try {
      setSaving(true)
      setMessage('')

      const employmentResponse = await fetch(
        `${API}/employment/by-code/${encodeURIComponent(employeeCode.trim())}`,
      )
      const employmentResult = await employmentResponse.json()

      if (!employmentResponse.ok) {
        throw new Error(employmentResult?.detail || 'Employee not found')
      }

      if (!employmentResult.user_id) {
        throw new Error('Employee User ID is missing')
      }

      const response = await fetch(`${API}/attendance/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: employmentResult.user_id,
          attendance_month: `${month}-01`,
          cl: Number(cl) || 0,
          el: Number(el) || 0,
          pl: Number(pl) || 0,
          lop: Number(lop) || 0,
          nh: nationalHolidays,
          sundays,
          other_paid_days: Number(otherPaidLeaves) || 0,
          net_present_days: netPresentDays,
          net_payable_days: netPayableDays,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.detail || 'Failed to save Attendance')
      }

      setAttendanceId(result.id)
      showMessage('Attendance saved successfully.', 'success')
      await loadRecords()
    } catch (error) {
      console.error(error)
      showMessage(
        error instanceof Error ? error.message : 'Unable to save Attendance',
        'error',
      )
    } finally {
      setSaving(false)
    }
  }

  const handleFileChange = async (file?: File) => {
    setSelectedFile(null)
    setPreviewRows([])
    setMessage('')

    if (!file) return

    const extension = file.name.split('.').pop()?.toLowerCase()

    if (!['xlsx', 'xls'].includes(extension ?? '')) {
      showMessage('Excel files only: please choose .xlsx or .xls.', 'error')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      showMessage('File is too large. Maximum size is 10 MB.', 'error')
      return
    }

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]

      if (!firstSheetName) {
        throw new Error('The Excel file has no worksheet.')
      }

      const sheet = workbook.Sheets[firstSheetName]
      const rawRows = XLSX.utils.sheet_to_json<ExcelRow>(sheet, {
        defval: '',
        raw: false,
      })

      if (rawRows.length === 0) {
        throw new Error('The selected worksheet has no data.')
      }

      const headers = Object.keys(rawRows[0]).map(normaliseHeader)
      const requiredHeaders = [
        'employee_code',
        'attendance_month',
        'net_present_days',
      ]

      const missingHeaders = requiredHeaders.filter(
        (header) => !headers.includes(header),
      )

      if (missingHeaders.length > 0) {
        throw new Error(
          `Missing required Excel columns: ${missingHeaders.join(', ')}.`,
        )
      }

      const parsed: PreviewRow[] = rawRows.map((rawRow, index) => {
        const rowNumber = index + 2
        const row: Record<string, unknown> = {}

        for (const [key, value] of Object.entries(rawRow)) {
          row[normaliseHeader(key)] = value
        }

        const code = String(row.employee_code ?? '').trim()

        if (!code) {
          throw new Error(`Row ${rowNumber}: employee_code is required.`)
        }

        const rawMonth = String(row.attendance_month ?? '').trim()
        let dateValue = ''

        if (/^\d{4}-\d{2}$/.test(rawMonth)) {
          dateValue = `${rawMonth}-01`
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(rawMonth)) {
          dateValue = rawMonth
        } else {
          const excelDate = new Date(rawMonth)

          if (!Number.isNaN(excelDate.getTime())) {
            dateValue = `${excelDate.getFullYear()}-${String(
              excelDate.getMonth() + 1,
            ).padStart(2, '0')}-01`
          }
        }

        if (!dateValue || Number.isNaN(Date.parse(dateValue))) {
          throw new Error(
            `Row ${rowNumber}: attendance_month must be YYYY-MM or YYYY-MM-DD.`,
          )
        }

        return {
          employee_code: code,
          attendance_month: dateValue,
          cl: toNumber(row.cl, 'cl', rowNumber),
          el: toNumber(row.el, 'el', rowNumber),
          pl: toNumber(row.pl, 'pl', rowNumber),
          lop: toNumber(row.lop, 'lop', rowNumber),
          nh: toNumber(row.nh, 'nh', rowNumber),
          sundays: toNumber(row.sundays, 'sundays', rowNumber),
          other_paid_days: toNumber(
            row.other_paid_days,
            'other_paid_days',
            rowNumber,
          ),
          net_present_days: toNumber(
            row.net_present_days,
            'net_present_days',
            rowNumber,
          ),
          net_payable_days: toNumber(
            row.net_payable_days,
            'net_payable_days',
            rowNumber,
          ),
        }
      })

      setSelectedFile(file)
      setPreviewRows(parsed)
      showMessage(`${parsed.length} Excel rows ready to preview.`, 'success')
    } catch (error) {
      console.error(error)
      showMessage(
        error instanceof Error ? error.message : 'Unable to read Excel file.',
        'error',
      )
    }
  }

  const handleSendExcel = async () => {
    if (!selectedFile || previewRows.length === 0) {
      showMessage('Choose a valid Excel file first.', 'error')
      return
    }

    try {
      setUploading(true)
      setMessage('')

      const response = await fetch(`${API}/attendance/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: previewRows }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.detail || 'Excel attendance upload failed.')
      }

      showMessage(
        result?.message ||
          `${result?.inserted_count ?? previewRows.length} attendance records saved successfully.`,
        'success',
      )

      setSelectedFile(null)
      setPreviewRows([])

      const input = document.getElementById(
        'attendance-excel-file',
      ) as HTMLInputElement | null

      if (input) input.value = ''

      await loadRecords()
    } catch (error) {
      console.error(error)
      showMessage(
        error instanceof Error ? error.message : 'Excel upload failed.',
        'error',
      )
    } finally {
      setUploading(false)
    }
  }

  const handleSelectCostElement = () => {
    if (!attendanceId) {
      showMessage('Please save Attendance first.', 'error')
      return
    }

    navigate('/admin/cost-of-element', {
      state: {
        employeeCode: employeeCode.trim(),
        attendanceId,
        netPresentDays,
        netPayableDays,
      },
    })
  }

  const inputClass = 'form-control'

  return (
    <div className="enquiry-page bg-light min-vh-100 py-5">
      <div className="container">
        <div className="card shadow-sm border-0">
          <div className="card-body p-4 p-lg-5">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
              <div>
                <p className="text-uppercase text-primary fw-semibold mb-1">
                  HR
                </p>
                <h1 className="h2 mb-0">Attendance</h1>
              </div>
            </div>

            {message && (
              <div
                className={`alert ${
                  messageType === 'success'
                    ? 'alert-success'
                    : 'alert-danger'
                }`}
                role="alert"
              >
                {message}
              </div>
            )}

            <div className="border rounded bg-white p-3 p-md-4 mb-3">
              <h2 className="h4 mb-3">Attendance Information</h2>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Employee Code</label>
                  <input
                    type="text"
                    value={employeeCode}
                    onChange={(event) => setEmployeeCode(event.target.value)}
                    className={inputClass}
                    placeholder="Enter employee code"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Attendance Month</label>
                  <input
                    type="month"
                    value={month}
                    onChange={(event) => {
                      setMonth(event.target.value)
                      void loadCompanyHolidays(event.target.value)
                    }}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="border rounded bg-white p-3 p-md-4 mb-3">
              <h2 className="h4 mb-3">Leave Details</h2>
              <div className="row g-3">
                {[
                  { label: 'Casual Leave (CL)', value: cl, setter: setCl },
                  { label: 'Earned Leave (EL)', value: el, setter: setEl },
                  { label: 'Paid Leave (PL)', value: pl, setter: setPl },
                  { label: 'Loss of Pay (LOP)', value: lop, setter: setLop },
                  {
                    label: 'Other Paid Days',
                    value: otherPaidLeaves,
                    setter: setOtherPaidLeaves,
                  },
                ].map((field) => (
                  <div className="col-md-3" key={field.label}>
                    <label className="form-label">{field.label}</label>
                    <input
                      type="number"
                      min="0"
                      value={field.value}
                      onChange={(event) => field.setter(event.target.value)}
                      className={inputClass}
                    />
                  </div>
                ))}

                <div className="col-md-3">
                  <label className="form-label">Days in Month</label>
                  <input
                    type="number"
                    value={daysInMonth}
                    disabled
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="border rounded bg-white p-3 p-md-4 mb-3">
              <h2 className="h4 mb-3">Attendance Calculation</h2>
              <div className="row g-3">
                {[
                  { label: 'National Holidays (NH)', value: nationalHolidays },
                  { label: 'Sundays', value: sundays },
                  { label: 'Net Present Days', value: netPresentDays },
                  { label: 'Net Payable Days', value: netPayableDays },
                ].map((field) => (
                  <div className="col-md-3" key={field.label}>
                    <label className="form-label">{field.label}</label>
                    <input
                      type="number"
                      value={field.value}
                      disabled
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="d-flex flex-wrap justify-content-end gap-2 mb-5">
              <button
                type="button"
                className="btn btn-primary btn-lg px-4"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>

              <HRBackButton />

              {attendanceId && (
                <button
                  type="button"
                  className="btn btn-outline-primary btn-lg px-4"
                  onClick={handleSelectCostElement}
                >
                  Select Cost Element
                </button>
              )}
            </div>

            <hr className="my-4" />

            <section className="border rounded bg-white p-3 p-md-4 mb-4">
              <h2 className="h4 mb-3">Upload Attendance Excel</h2>

              <div className="mb-3">
                <label htmlFor="attendance-excel-file" className="form-label">
                  Select Excel file
                </label>

                <input
                  id="attendance-excel-file"
                  type="file"
                  accept=".xlsx,.xls"
                  className={inputClass}
                  onChange={(event) => {
                    void handleFileChange(event.target.files?.[0])
                  }}
                  disabled={uploading}
                />
              </div>

              {selectedFile && (
                <p className="small mb-3">
                  Selected: <strong>{selectedFile.name}</strong>
                </p>
              )}

              {previewRows.length > 0 && (
                <>
                  <h3 className="h5 mt-4">Excel Preview</h3>

                  <div className="table-responsive">
                    <table className="table table-bordered table-striped align-middle">
                      <thead>
                        <tr>
                          {[
                            'Employee Code',
                            'Month',
                            'CL',
                            'EL',
                            'PL',
                            'LOP',
                            'NH',
                            'Sundays',
                            'Other Paid',
                            'Net Present',
                            'Net Payable',
                          ].map((heading) => (
                            <th key={heading}>{heading}</th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {previewRows.slice(0, 10).map((row, index) => (
                          <tr key={`${row.employee_code}-${index}`}>
                            <td>{row.employee_code}</td>
                            <td>{row.attendance_month}</td>
                            <td>{row.cl}</td>
                            <td>{row.el}</td>
                            <td>{row.pl}</td>
                            <td>{row.lop}</td>
                            <td>{row.nh}</td>
                            <td>{row.sundays}</td>
                            <td>{row.other_paid_days}</td>
                            <td>{row.net_present_days}</td>
                            <td>{row.net_payable_days}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {previewRows.length > 10 && (
                    <p className="small text-muted">
                      Showing first 10 of {previewRows.length} rows in preview.
                    </p>
                  )}

                  <button
                    type="button"
                    className="btn btn-success px-4"
                    onClick={handleSendExcel}
                    disabled={uploading}
                  >
                    {uploading
                      ? 'Sending...'
                      : `Send ${previewRows.length} Rows to API`}
                  </button>
                </>
              )}
            </section>

            <section className="border rounded bg-white p-3 p-md-4">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <h2 className="h4 mb-0">Saved Attendance Records</h2>

                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => void loadRecords()}
                >
                  Refresh
                </button>
              </div>

              {records.length > 0 && (
                <>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>User ID</th>
                          <th>Month</th>
                          <th>CL</th>
                          <th>EL</th>
                          <th>PL</th>
                          <th>LOP</th>
                          <th>NH</th>
                          <th>Sundays</th>
                          <th>Other Paid</th>
                          <th>Net Present</th>
                          <th>Net Payable</th>
                        </tr>
                      </thead>

                      <tbody>
                        {paginatedRecords.map((record) => (
                          <tr key={record.id}>
                            <td>{record.id}</td>
                            <td>{record.user_id}</td>
                            <td>{displayDate(record.attendance_month)}</td>
                            <td>{record.cl}</td>
                            <td>{record.el}</td>
                            <td>{record.pl}</td>
                            <td>{record.lop}</td>
                            <td>{record.nh}</td>
                            <td>{record.sundays}</td>
                            <td>{record.other_paid_days}</td>
                            <td>{record.net_present_days}</td>
                            <td>{record.net_payable_days ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

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
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AttendanceForm