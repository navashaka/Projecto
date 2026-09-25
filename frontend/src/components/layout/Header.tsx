import { useAppStore } from '../../store'
import Navbar from './Navbar'

const Header = () => {
  const logout = useAppStore((state) => state.logout)
  const session = useAppStore((state) => state.session)

  return (
    <header className="navbar navbar-expand-lg bg-white border-bottom shadow-sm px-3 py-2">
      <div className="d-flex align-items-center justify-content-between w-100 gap-3">
        <div className="d-flex align-items-center flex-grow-1">
          <Navbar />
        </div>

        <div className="brand-block d-flex align-items-center ms-auto gap-3">
          <div className="d-flex align-items-center gap-2 text-muted small fw-semibold">
            <span className="badge bg-light text-dark rounded-pill">{session?.name ?? 'User'}</span>
          </div>
          <div className="brand-mark">P</div>
          <div className="brand-name">Projecto</div>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
