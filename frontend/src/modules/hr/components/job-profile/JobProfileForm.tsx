import { useState } from 'react'

function JobProfileForm() {
  const [jobDescription, setJobDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setSubmitting(true)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      const response = await fetch('http://127.0.0.1:8000/job-profile/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_description: jobDescription,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.detail
            ? JSON.stringify(data.detail)
            : 'Failed to submit job profile',
        )
      }

      setSuccessMessage('Submitted successfully!')
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
              <p className="text-muted mb-0">
                Capture the job description.
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

            <form onSubmit={handleSubmit}>
              <div className="border rounded bg-white p-3 p-md-4 mb-3">
                <h5 className="mb-3">Job Profile Details</h5>

                <div className="row g-3">
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

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  )
}

export default JobProfileForm