import { useState, type FormEvent } from 'react'
import axios from 'axios'
import type { UserRole, UserSession } from '../../store'
import { loginUser, type LoginCredentials } from '../../actions/dbActions'

type LoginPageProps = {
  onLogin: (user: UserSession) => void
  onRegister: () => void
}

const LoginPage = ({ onLogin, onRegister }: LoginPageProps) => {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<UserRole>('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await loginUser({
        email: email.trim(),
        name: name.trim(),
        password,
        role
      } satisfies LoginCredentials)
      const user = response.data

      if (
        !user.email ||
        !user.name ||
        !['admin', 'customer', 'employee'].includes(user.role)
      ) {
        throw new Error('The login service returned an invalid user profile.')
      }

      onLogin(user)
    } catch (loginError) {
      if (axios.isAxiosError<{ detail?: string }>(loginError)) {
        setError(
          loginError.response?.data?.detail ??
            'Unable to connect to the login service. Please try again.'
        )
      } else {
        setError(
          loginError instanceof Error
            ? loginError.message
            : 'Unable to sign in. Please try again.'
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-page bg-light min-vh-100 d-flex align-items-center justify-content-center p-3">
      <div className="card shadow-sm border-0" style={{ width: '100%', maxWidth: '430px' }}>
        <div className="card-body p-4 p-md-5">
          <div className="d-flex align-items-center justify-content-center gap-2 mb-4">
            <div className="brand-mark">P</div>
            <h1 className="h3 mb-0">Projecto</h1>
          </div>

          <h2 className="h3 text-center mb-2">Login </h2>
          <p className="text-muted text-center mb-4">Sign in to continue to your workspace</p>

          <form
            className="row g-3"
            onSubmit={handleSubmit}
          >
            <div className="col-12">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="col-12">
              <label className="form-label" htmlFor="login-name">Name</label>
              <input
                id="login-name"
                type="text"
                className="form-control"
                placeholder="Your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                required
              />
            </div>

            <div className="col-12">
              <label className="form-label" htmlFor="login-role">Role</label>
              <select
                id="login-role"
                className="form-select"
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
                required
              >
                <option value="admin">Admin</option>
                <option value="customer">Customer</option>
                <option value="employee">Employee</option>
              </select>
            </div>

            <div className="col-12">
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="col-12" role="alert">
                <div className="alert alert-danger mb-0">{error}</div>
              </div>
            )}

            <div className="col-12 mt-3">
              <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
                {isSubmitting ? 'Checking account…' : 'Login'}
              </button>
            </div>
          </form>

          <p className="text-center text-muted mt-4 mb-0">
            Don&apos;t have an account?{' '}
            <button type="button" className="btn btn-link p-0 align-baseline" onClick={onRegister}>
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
