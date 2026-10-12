import { useState, type FormEvent } from 'react'

type AdminLoginPageProps = {
  onLogin: (email: string, password: string) => Promise<void>
  onBack: () => void
}

const AdminLoginPage = ({
  onLogin,
  onBack,
}: AdminLoginPageProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await onLogin(email, password)
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : 'Unable to sign in.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page bg-light min-vh-100 d-flex align-items-center justify-content-center p-3">
      <div
        className="card shadow-sm border-0"
        style={{ width: '100%', maxWidth: '430px' }}
      >
        <div className="card-body p-4 p-md-5">
          <div className="d-flex align-items-center justify-content-center gap-2 mb-4">
            <div className="brand-mark">P</div>
            <h1 className="h3 mb-0">Projecto</h1>
          </div>

          <h2 className="h3 text-center mb-2">Admin Login</h2>
          <p className="text-muted text-center mb-4">
            Sign in with your administrator credentials
          </p>

          <form className="row g-3" onSubmit={handleSubmit}>
            <div className="col-12">
              <label className="form-label" htmlFor="admin-email">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                className="form-control"
                placeholder="Admin email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="col-12">
              <label className="form-label" htmlFor="admin-password">
                Password
              </label>
              <div className="input-group">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <div className="col-12">
                <div className="alert alert-danger mb-0" role="alert">
                  {error}
                </div>
              </div>
            )}

            <div className="col-12 mt-3">
              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={submitting}
              >
                {submitting ? 'Signing in...' : 'Admin Sign In'}
              </button>
            </div>
          </form>

          <button
            type="button"
            className="btn btn-outline-secondary w-100 mt-3"
            onClick={onBack}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminLoginPage