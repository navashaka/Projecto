import { useState } from 'react'
import { z } from 'zod'
import * as XLSX from 'xlsx'
import HRBackButton from '../HRBackButton'

const jobProfileSchema = z.object({
  job_role: z.string().min(1, 'Job role is required.'),
  job_description: z.string().nullable(),
})

type JobProfileRow = {
  job_role: string
  job_description: string | null
}

function JobProfileForm() {
  const [jobRole, setJobRole] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [excelRows, setExcelRows] = useState<JobProfileRow[]>([])
  const [excelError, setExcelError] = useState('')
  const [savingExcel, setSavingExcel] = useState(false)

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        job_role: '',
        job_description: '',
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    worksheet['!cols'] = [
      { wch: 30 },
      { wch: 60 },
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Job Profile Template')

    XLSX.writeFile(workbook, 'Job_Profile_Template.xlsx')
  }

  const handleExcelSelect = async (file?: File) => {
    setExcelRows([])
    setExcelError('')
    setSuccessMessage('')
    setErrorMessage('')

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

      if (!sheet) {
        throw new Error('Excel worksheet not found.')
      }

      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: '',
        raw: true,
      })

      if (rows.length < 2) {
        throw new Error('Excel file has no data rows.')
      }

      const headers = rows[0].map((value) =>
        String(value ?? '')
          .trim()
          .toLowerCase()
          .replace(/[\s-]+/g, '_'),
      )

      const nonEmptyHeaders = headers.filter(Boolean)

      if (
        nonEmptyHeaders.length !== new Set(nonEmptyHeaders).size
      ) {
        throw new Error('Excel file contains duplicate column headers.')
      }

      const requiredHeaders = ['job_role', 'job_description']
      const missingHeaders = requiredHeaders.filter(
        (header) => !headers.includes(header),
      )

      if (missingHeaders.length) {
        throw new Error(
          `Excel file must contain these columns: ${requiredHeaders.join(', ')}.`,
        )
      }

      const unsupported = headers.filter(
        (header) => header && !requiredHeaders.includes(header),
      )

      if (unsupported.length) {
        throw new Error(
          `Unsupported Excel columns: ${unsupported.join(', ')}.`,
        )
      }

      const parsedRows: JobProfileRow[] = []
      const errors: string[] = []

      rows.slice(1).forEach((cells, index) => {
        if (cells.every((value) => value === '' || value == null)) {
          return
        }

        const jobRoleValue = cells[headers.indexOf('job_role')]
        const jobDescriptionValue =
          cells[headers.indexOf('job_description')]

        if (
          jobRoleValue !== '' &&
          jobRoleValue != null &&
          typeof jobRoleValue !== 'string'
        ) {
          errors.push(`Row ${index + 2}: job_role must be text.`)
          return
        }

        if (
          jobDescriptionValue !== '' &&
          jobDescriptionValue != null &&
          typeof jobDescriptionValue !== 'string' &&
          typeof jobDescriptionValue !== 'number'
        ) {
          errors.push(
            `Row ${index + 2}: job_description must be text.`,
          )
          return
        }

        const parsed = jobProfileSchema.safeParse({
          job_role:
            jobRoleValue == null
              ? ''
              : String(jobRoleValue).trim(),
          job_description:
            jobDescriptionValue == null ||
            jobDescriptionValue === ''
              ? null
              : typeof jobDescriptionValue === 'string'
                ? jobDescriptionValue.trim()
                : String(jobDescriptionValue),
        })

        if (!parsed.success) {
          errors.push(
            `Row ${index + 2}: ${parsed.error.issues
              .map(
                (issue) =>
                  `${issue.path.join('.') || 'row'}: ${issue.message}`,
              )
              .join(', ')}`,
          )
          return
        }

        parsedRows.push(parsed.data)
      })

      if (!parsedRows.length && !errors.length) {
        throw new Error('Excel file has no non-empty data rows.')
      }

      setExcelRows(parsedRows)
      setExcelError(errors.join('\n'))

      if (parsedRows.length) {
        setSuccessMessage(
          `${parsedRows.length} row(s) ready for preview.`,
        )
      }
    } catch (error) {
      setExcelRows([])
      setExcelError(
        error instanceof Error
          ? error.message
          : 'Unable to read Excel file.',
      )
    }
  }

  const saveExcelRows = async () => {
    if (savingExcel || !excelRows.length || excelError) return

    setSavingExcel(true)
    setSuccessMessage('')
    setErrorMessage('')

    const failedRows: JobProfileRow[] = []
    const failures: string[] = []
    let savedCount = 0

    try {
      for (const [index, row] of excelRows.entries()) {
        try {
          const response = await fetch(
            'http://127.0.0.1:8000/job-profile/',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(row),
            },
          )

          const data = await response.json().catch(() => null)

          if (!response.ok) {
            throw new Error(
              data?.detail
                ? JSON.stringify(data.detail)
                : 'Save failed.',
            )
          }

          savedCount += 1
        } catch (error) {
          failedRows.push(row)
          failures.push(
            `Row ${index + 2}: ${
              error instanceof Error
                ? error.message
                : 'Save failed.'
            }`,
          )
        }
      }

      setExcelRows(failedRows)

      if (savedCount) {
        setSuccessMessage(
          `${savedCount} job profile record(s) saved successfully.`,
        )
      }

      setExcelError('')

      if (failures.length) {
        setErrorMessage(failures.join('\n'))
      }
    } finally {
      setSavingExcel(false)
    }
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const parsed = jobProfileSchema.safeParse({
      job_role: jobRole.trim(),
      job_description: jobDescription.trim() || null,
    })

    if (!parsed.success) {
      setErrorMessage(
        parsed.error.issues
          .map((issue) => issue.message)
          .join(', '),
      )
      return
    }

    setSubmitting(true)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/job-profile/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(parsed.data),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.detail
            ? JSON.stringify(data.detail)
            : 'Failed to submit job profile',
        )
      }

      setSuccessMessage('Submitted successfully!')
      setJobRole('')
      setJobDescription('')
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-light min-vh-100 py-5">
      <div className="container">
        <div className="card shadow-sm border-0">
          <div className="card-body p-4 p-lg-5">
            <div className="mb-4">
              <h2 className="mb-1">Job Profile</h2>
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

            <section className="border rounded bg-white p-3 p-md-4 mb-3">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <h5 className="mb-0">Upload Excel</h5>

                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={handleDownloadTemplate}
                >
                  Download Template
                </button>
              </div>

              <input
                type="file"
                accept=".xlsx,.xls"
                className="form-control"
                disabled={savingExcel}
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  void handleExcelSelect(file)
                }}
              />

              {excelError && (
                <div className="alert alert-danger mt-3 mb-0">
                  <pre className="mb-0 text-wrap">
                    {excelError}
                  </pre>
                </div>
              )}

              {excelRows.length > 0 && (
                <>
                  <h6 className="mt-3">
                    Excel Preview ({excelRows.length} rows)
                  </h6>

                  <div className="table-responsive">
                    <table className="table table-bordered table-sm">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Job Role</th>
                          <th>Job Description</th>
                        </tr>
                      </thead>

                      <tbody>
                        {excelRows.map((row, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{row.job_role}</td>
                            <td>{row.job_description ?? ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={savingExcel || Boolean(excelError)}
                    onClick={() => void saveExcelRows()}
                  >
                    {savingExcel ? 'Saving...' : 'Save'}
                  </button>
                </>
              )}
            </section>

            <form onSubmit={handleSubmit}>
              <div className="border rounded bg-white p-3 p-md-4 mb-3">
                <h5 className="mb-3">Job Profile Details</h5>

                <div className="row g-3">
                  <div className="col-12">
                    <label
                      htmlFor="job_role"
                      className="form-label"
                    >
                      Job Role
                    </label>

                    <input
                      id="job_role"
                      type="text"
                      className="form-control"
                      value={jobRole}
                      onChange={(event) =>
                        setJobRole(event.target.value)
                      }
                      placeholder="Enter job role"
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label
                      htmlFor="job_description"
                      className="form-label"
                    >
                      Job Description
                    </label>

                    <textarea
                      id="job_description"
                      className="form-control"
                      rows={7}
                      value={jobDescription}
                      onChange={(event) =>
                        setJobDescription(event.target.value)
                      }
                      placeholder="Enter job description"
                    />
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>

                <HRBackButton />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JobProfileForm