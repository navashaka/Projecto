import { useEffect, useRef, useState } from 'react'
import HRBackButton from '../HRBackButton'

type Holiday = {
  id: number
  holiday_date: string
  holiday_name: string
}

function CompanyHolidayForm() {
  const [holidayDate, setHolidayDate] = useState('')
  const [holidayName, setHolidayName] = useState('')
  const [holidays, setHolidays] = useState<Holiday[]>([])

  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const loadHolidays = async () => {
    try {
      const response = await fetch(
        'http://127.0.0.1:8000/company-holidays/',
      )

      if (!response.ok) {
        throw new Error('Failed to load company holidays')
      }

      const data: Holiday[] = await response.json()
      setHolidays(data)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to load holidays',
      )
    }
  }

  useEffect(() => {
    loadHolidays()
  }, [])

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setLoading(true)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/company-holidays/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            holiday_date: holidayDate,
            holiday_name: holidayName,
          }),
        },
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result?.detail
            ? JSON.stringify(result.detail)
            : 'Failed to add company holiday',
        )
      }

      setSuccessMessage('Holiday added successfully!')
      setHolidayDate('')
      setHolidayName('')

      await loadHolidays()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong',
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
      const response = await fetch(
        `http://127.0.0.1:8000/company-holidays/${holidayId}`,
        {
          method: 'DELETE',
        },
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result?.detail || 'Failed to delete holiday',
        )
      }

      setSuccessMessage('Holiday deleted successfully!')

      await loadHolidays()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to delete holiday',
      )
    } finally {
      setDeletingId(null)
    }
  }

  const handleCsvUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setSuccessMessage('')
    setErrorMessage('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/company-holidays/upload',
        {
          method: 'POST',
          body: formData,
        },
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result?.detail || 'Failed to upload CSV',
        )
      }

      setSuccessMessage(
        `${result.uploaded_count} holiday(s) uploaded successfully!`,
      )

      await loadHolidays()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to upload CSV',
      )
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="bg-light min-vh-100 py-5">
      <div className="container">
        <div className="card shadow-sm border-0">
          <div className="card-body p-4 p-lg-5">

            <div className="mb-4">
              <h2 className="mb-1">Company Holidays</h2>
              <p className="text-muted mb-0">
                Manage company holidays
              </p>
            </div>

            {successMessage && (
              <div className="alert alert-success">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="alert alert-danger">
                {errorMessage}
              </div>
            )}

            <div className="border rounded bg-white p-3 p-md-4 mb-4">
              <h5 className="mb-3">Add Holiday</h5>

              <form onSubmit={handleSubmit}>
                <div className="row g-3">

                  <div className="col-md-6">
                    <label className="form-label">
                      Holiday Date
                    </label>

                    <input
                      type="date"
                      className="form-control"
                      value={holidayDate}
                      onChange={(event) =>
                        setHolidayDate(event.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Holiday Name
                    </label>

                    <input
                      type="text"
                      className="form-control"
                      value={holidayName}
                      onChange={(event) =>
                        setHolidayName(event.target.value)
                      }
                      maxLength={150}
                      placeholder="Enter holiday name"
                      required
                    />
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

              <p className="text-muted">
                CSV columns must be:
                <br />
                <strong>holiday_date, holiday_name</strong>
              </p>

              <input
                ref={fileInputRef}
                type="file"
                className="form-control mb-3"
                accept=".csv"
                onChange={handleCsvUpload}
              />

              <small className="text-muted">
                Example: 2026-10-02, Gandhi Jayanti
              </small>
            </div>

            <div className="border rounded bg-white p-3 p-md-4">
              <h5 className="mb-3">Company Holiday List</h5>

              {holidays.length === 0 ? (
                <p className="text-muted mb-0">
                  No holidays found.
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>#</th>
                        <th>Holiday Date</th>
                        <th>Holiday Name</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {holidays.map((holiday, index) => (
                        <tr key={holiday.id}>
                          <td>{index + 1}</td>
                          <td>{holiday.holiday_date}</td>
                          <td>{holiday.holiday_name}</td>

                          <td>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              disabled={
                                deletingId === holiday.id
                              }
                              onClick={() =>
                                handleDelete(holiday.id)
                              }
                            >
                              {deletingId === holiday.id
                                ? 'Deleting...'
                                : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default CompanyHolidayForm