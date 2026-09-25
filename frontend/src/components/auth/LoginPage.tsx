type LoginPageProps = {
  onLogin: () => void
  onRegister: () => void
}

const LoginPage = ({ onLogin, onRegister }: LoginPageProps) => {
  return (
    <div className="login-page bg-light min-vh-100 d-flex align-items-center justify-content-center p-3">
      <div className="card shadow-sm border-0" style={{ width: '100%', maxWidth: '430px' }}>
        <div className="card-body p-4 p-md-5">
          <div className="d-flex align-items-center justify-content-center gap-2 mb-4">
            <div className="brand-mark">P</div>
            <h1 className="h3 mb-0">Projecto</h1>
          </div>

          <h2 className="h3 text-center mb-2">Welcome back</h2>
          <p className="text-muted text-center mb-4">Sign in to continue to your workspace</p>

          <form
            className="row g-3"
            onSubmit={(event) => {
              event.preventDefault()
              onLogin()
            }}
          >
            <div className="col-12">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="you@example.com"
                defaultValue="admin@projecto.com"
              />
            </div>

            <div className="col-12">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter your password"
                defaultValue="admin123"
              />
            </div>

            <div className="col-12 mt-3">
              <button type="submit" className="btn btn-primary w-100">
                Login
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
