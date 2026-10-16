import { useState, type FormEvent } from 'react'
import { changeAdminPassword } from '../../services/authApi'
import type { AdminLoginResponse } from '../../services/authApi'

type ChangePasswordPageProps = {
  onPasswordChanged: (response: AdminLoginResponse) => void
  onLogout: () => Promise<void>
}

function getErrorMessage(error: unknown): string {
  if (
    typeof error === 'object'
    && error !== null
    && 'response' in error
    && typeof error.response === 'object'
    && error.response !== null
    && 'data' in error.response
    && typeof error.response.data === 'object'
    && error.response.data !== null
    && 'detail' in error.response.data
    && typeof error.response.data.detail === 'string'
  ) {
    return error.response.data.detail
  }
  return error instanceof Error ? error.message : 'Unable to change password.'
}

export default function ChangePasswordPage({
  onPasswordChanged,
  onLogout,
}: ChangePasswordPageProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [logoutError, setLogoutError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const newPasswordError = (() => {
    if (!newPassword) return ''
    if (newPassword === currentPassword) {
      return 'New password must be different from the current password.'
    }
    if (newPassword.length < 12) {
      return 'New password must be at least 12 characters long.'
    }
    if (
      !/[a-z]/.test(newPassword)
      || !/[A-Z]/.test(newPassword)
      || !/[0-9]/.test(newPassword)
    ) {
      return 'New password must include lowercase and uppercase letters and at least one number.'
    }
    if (/\s/.test(newPassword)) {
      return 'New password must not contain whitespace.'
    }
    return ''
  })()
  const confirmationError =
    confirmNewPassword && confirmNewPassword !== newPassword
      ? 'New password and confirmation do not match.'
      : ''

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (confirmationError) {
      setError(confirmationError)
      return
    }
    if (newPasswordError) {
      setError(newPasswordError)
      return
    }
    setSubmitting(true)
    try {
      const response = await changeAdminPassword(
        currentPassword,
        newPassword,
        confirmNewPassword,
      )
      onPasswordChanged(response)
      setSuccess('Password changed successfully.')
    } catch (changeError) {
      setError(getErrorMessage(changeError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page bg-light min-vh-100 d-flex align-items-center justify-content-center p-3">
      <section className="card shadow-sm border-0" style={{ width: '100%', maxWidth: '480px' }}>
        <div className="card-body p-4 p-md-5">
          <h1 className="h3 text-center mb-2">Change Admin Password</h1>
          <p className="text-muted text-center mb-4">
            Use at least 12 characters with uppercase, lowercase, and a number.
          </p>
          <form className="row g-3" onSubmit={handleSubmit}>
            <div className="col-12">
              <label className="form-label" htmlFor="current-password">Current Password</label>
              <input
                id="current-password"
                type="password"
                className="form-control"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                maxLength={1024}
                required
              />
            </div>
            <div className="col-12">
              <label className="form-label" htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                type="password"
                className="form-control"
                autoComplete="new-password"
                minLength={12}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                maxLength={1024}
                required
              />
              {newPasswordError && (
                <div className="form-text text-danger" role="alert">
                  {newPasswordError}
                </div>
              )}
            </div>
            <div className="col-12">
              <label className="form-label" htmlFor="confirm-new-password">Confirm New Password</label>
              <input
                id="confirm-new-password"
                type="password"
                className="form-control"
                autoComplete="new-password"
                minLength={12}
                value={confirmNewPassword}
                onChange={(event) => setConfirmNewPassword(event.target.value)}
                maxLength={1024}
                required
              />
              {confirmationError && (
                <div className="form-text text-danger" role="alert">
                  {confirmationError}
                </div>
              )}
            </div>
            {error && (
              <div className="col-12">
                <div className="alert alert-danger mb-0" role="alert">{error}</div>
              </div>
            )}
            {success && (
              <div className="col-12">
                <div className="alert alert-success mb-0" role="status">{success}</div>
              </div>
            )}
            <div className="col-12">
              <button className="btn btn-primary w-100" type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Change Password'}
              </button>
            </div>
          </form>
          {logoutError && (
            <div className="alert alert-danger mt-3 mb-0" role="alert">{logoutError}</div>
          )}
          <button
            className="btn btn-link w-100 mt-2"
            type="button"
            onClick={() => {
              setLogoutError('')
              void onLogout().catch(() => {
                setLogoutError('Unable to contact the server to revoke this session. Please try again.')
              })
            }}
          >
            Log out
          </button>
        </div>
      </section>
    </main>
  )
}
