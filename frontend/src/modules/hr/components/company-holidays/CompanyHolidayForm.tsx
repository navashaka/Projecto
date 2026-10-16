import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import apiClient from '../../../../services/apiClient'
import { useAppStore } from '../../../../store'
import HRBackButton from '../HRBackButton'
import * as XLSX from 'xlsx'

type Holiday = {
  id: number
  holiday_date: string
  holiday_name: string
}

type PreviewHoliday = {
  holiday_date: string
  holiday_name: string
}

const PAGE_SIZE = 10

function CompanyHolidayForm() {
  const session = useAppStore((state) => state.session)
  const isAdmin = session?.role === 'admin' && Boolean(session.accessToken)

  const [holidayDate, setHolidayDate] = useState('')
  const [holidayName, setHolidayName] = useState('')
  const [holidayNameTouched, setHolidayNameTouched] = useState(false)
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [preview, setPreview] = useState<PreviewHoliday[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingHolidays, setLoadingHolidays] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const loadHolidays = useCallback(async () => {
    setLoadingHolidays(true)
    try {
      const response = await apiClient.get('/company-holidays/')
      setHolidays(Array.isArray(response.data) ? response.data : [])
    } catch {
      setErrorMessage('Unable to load company holidays')
    } finally {
      setLoadingHolidays(false)
    }
  }, [])

  useEffect(() => {
    void loadHolidays()
  }, [loadHolidays])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setHolidayNameTouched(true)
    if (!holidayName.trim()) {
      setErrorMessage('Holiday name is required.')
      return
    }

    setLoading(true)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      await apiClient.post('/company-holidays/', {
        holiday_date: holidayDate,
        holiday_name: holidayName.trim(),
      })

      setSuccessMessage('Holiday added successfully!')
      setHolidayDate('')
      setHolidayName('')
      setHolidayNameTouched(false)
      await loadHolidays()
    } catch (error) {
      const err = error as {
        response?: { data?: { detail?: string } }
      }
      setErrorMessage(
        err.response?.data?.detail ?? 'Failed to add company holiday',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (holidayId: number) => {
    setDeletingId(holidayId)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      await apiClient.delete(`/company-holidays/${holidayId}`)
      setSuccessMessage('Holiday deleted successfully!')
      await loadHolidays()
    } catch (error) {
      const err = error as {
        response?: { data?: { detail?: string } }
      }
      setErrorMessage(err.response?.data?.detail ?? 'Unable to delete holiday')
    } finally {
      setDeletingId(null)
    }
  }

  const formatExcelDate = (value: unknown): string => {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return [
        value.getFullYear(),
        String(value.getMonth() + 1).padStart(2, '0'),
        String(value.getDate()).padStart(2, '0'),
      ].join('-')
    }

    if (typeof value === 'number') {
      const parsed = XLSX.SSF.parse_date_code(value)
      if (parsed) {
        return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`
      }
    }

    return String(value ?? '').trim()
  }

  const handleExcelSelect = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    setPreview([])
    setSuccessMessage('')
    setErrorMessage('')

    if (!file) return

    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setErrorMessage('Please upload an Excel file in .xlsx or .xls format')
      event.target.value = ''
      return
    }

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, {
        type: 'array',
        cellDates: true,
      })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]

      if (!sheet) throw new Error('Excel file has no worksheet')

      const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: '',
        raw: true,
      })

      if (rows.length < 2) {
        throw new Error('Excel file has no holiday records')
      }

      const headers = rows[0].map((value) =>
        String(value).trim().toLowerCase(),
      )
      const dateIndex = headers.indexOf('holiday_date')
      const nameIndex = headers.indexOf('holiday_name')
      const unexpectedHeaders = headers.filter(
        (header) => !['holiday_date', 'holiday_name'].includes(header),
      )

      if (dateIndex === -1 || nameIndex === -1 || unexpectedHeaders.length) {
        throw new Error(
          [
            ...(dateIndex === -1 || nameIndex === -1
              ? ['Excel must contain holiday_date and holiday_name columns']
              : []),
            ...(unexpectedHeaders.length
              ? [`Unsupported Excel columns: ${unexpectedHeaders.join(', ')}`]
              : []),
          ].join('. '),
        )
      }

      const parsed: PreviewHoliday[] = []

      for (let index = 1; index < rows.length; index++) {
        const row = rows[index]
        const rawDate = row[dateIndex]
        const rawName = row[nameIndex]

        if (
          (rawDate === '' || rawDate == null) &&
          (rawName === '' || rawName == null)
        ) {
          continue
        }

        const date = formatExcelDate(rawDate)
        const name = String(rawName ?? '').trim()

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !name) {
          throw new Error(`Invalid holiday date or name in row ${index + 1}`)
        }
        if (name.length > 150) {
          throw new Error(`Holiday name exceeds 150 characters in row ${index + 1}`)
        }

        const [year, month, day] = date.split('-').map(Number)
        const checkDate = new Date(Date.UTC(year, month - 1, day))

        if (
          checkDate.getUTCFullYear() !== year ||
          checkDate.getUTCMonth() !== month - 1 ||
          checkDate.getUTCDate() !== day
        ) {
          throw new Error(`Invalid date in row ${index + 1}`)
        }

        parsed.push({ holiday_date: date, holiday_name: name })
      }

      if (parsed.length === 0) {
        throw new Error('No valid holiday records found')
      }

      setPreview(parsed)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to read Excel file',
      )
      setPreview([])
      event.target.value = ''
    }
  }

  const handleSave = async () => {
    if (uploading || preview.length === 0) return

    setUploading(true)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(preview)
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Holidays')

      const excelData = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      })

      const formData = new FormData()
      formData.append(
        'file',
        new Blob([excelData], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        'company_holidays.xlsx',
      )

      const response = await apiClient.post(
        '/company-holidays/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      )

      setSuccessMessage(
        response.data?.message ??
          `${response.data?.uploaded_count ?? preview.length} holidays saved successfully!`,
      )
      setPreview([])
      if (fileInputRef.current) fileInputRef.current.value = ''
      await loadHolidays()
      setCurrentPage(1)
    } catch (error) {
      const err = error as {
        response?: { data?: { detail?: string | { msg?: string }[] } }
      }
      const detail = err.response?.data?.detail

      setErrorMessage(
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((item) => item.msg ?? 'Invalid data').join(', ')
            : 'Unable to save holidays',
      )
    } finally {
      setUploading(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(holidays.length / PAGE_SIZE))
  const pageHolidays = holidays.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  return (
    <div className="bg-light min-vh-100 py-5">
      <div className="container">
        <div className="card shadow-sm border-0">
          <div className="card-body p-4 p-lg-5">
            <div className="mb-4">
              <h2 className="mb-1">Company Holidays</h2>
            </div>

            {successMessage && (
              <div className="alert alert-success" role="status">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="alert alert-danger" role="alert">
                {errorMessage}
              </div>
            )}

            <div className="border rounded bg-white p-3 p-md-4 mb-4">
              <h5 className="mb-3">Add Holiday</h5>

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Holiday Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={holidayDate}
                      onChange={(event) => setHolidayDate(event.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Holiday Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={holidayName}
                      onChange={(event) => setHolidayName(event.target.value)}
                      onBlur={() => setHolidayNameTouched(true)}
                      maxLength={150}
                      placeholder="Enter holiday name"
                      required
                    />
                    {holidayNameTouched && !holidayName.trim() && (
                      <div className="text-danger small mt-1" role="alert">
                        Holiday name is required.
                      </div>
                    )}
                  </div>

                  <div className="col-12 d-flex justify-content-end gap-2">
                    <HRBackButton />
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Adding...' : 'Add Holiday'}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div className="border rounded bg-white p-3 p-md-4 mb-4">
              <h5 className="mb-3">Upload Holiday List</h5>

              <input
                ref={fileInputRef}
                type="file"
                className="form-control mb-3"
                accept=".xlsx,.xls"
                disabled={uploading}
                onChange={handleExcelSelect}
              />

              {preview.length > 0 && (
                <div className="mt-4">
                  <h6>Preview ({preview.length} records)</h6>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>Holiday Date</th>
                          <th>Holiday Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((holiday, index) => (
                          <tr key={`${holiday.holiday_date}-${index}`}>
                            <td>{index + 1}</td>
                            <td>{holiday.holiday_date}</td>
                            <td>{holiday.holiday_name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      disabled={uploading}
                      onClick={() => {
                        setPreview([])
                        setErrorMessage('')
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={uploading}
                      onClick={handleSave}
                    >
                      {uploading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="border rounded bg-white p-3 p-md-4">
              <h5 className="mb-3">Company Holiday List</h5>

              {loadingHolidays ? (
                <p className="text-muted mb-0">Loading holidays...</p>
              ) : holidays.length === 0 ? (
                <p className="text-muted mb-0">No holidays found.</p>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>Holiday Date</th>
                          <th>Holiday Name</th>
                          {isAdmin && <th>Action</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {pageHolidays.map((holiday, index) => (
                          <tr key={holiday.id}>
                            <td>{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                            <td>{holiday.holiday_date}</td>
                            <td>{holiday.holiday_name}</td>
                            {isAdmin && (
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  disabled={deletingId === holiday.id}
                                  onClick={() => handleDelete(holiday.id)}
                                >
                                  {deletingId === holiday.id
                                    ? 'Deleting...'
                                    : 'Delete'}
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <small className="text-muted">
                      Page {currentPage} of {totalPages} · {holidays.length} records
                    </small>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((page) => page - 1)}
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((page) => page + 1)}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompanyHolidayForm