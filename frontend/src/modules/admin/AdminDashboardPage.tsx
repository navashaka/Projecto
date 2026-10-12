import { Link } from 'react-router-dom'
import { useState } from 'react'

type AdminDashboardPageProps = {
  email: string
  onLogout: () => Promise<void>
}

const sections = [
  { name: 'HR Admin', description: 'Review and manage submitted HR records.', href: '/hr-admin' },
  { name: 'GL Admin', description: 'Review and manage submitted GL records.', href: '/gl-admin' },
  { name: 'Inventory Admin', description: 'Review and manage submitted Inventory records.', href: '/inventory-admin' },
]

export default function AdminDashboardPage({
  email,
  onLogout,
}: AdminDashboardPageProps) {
  const [logoutError, setLogoutError] = useState('')

  return (
    <main className="container py-5">
      <header className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h2 mb-1">Projecto Admin Dashboard</h1>
          <p className="text-muted mb-0">Signed in as {email}</p>
        </div>
        <div>
          <button
            className="btn btn-outline-secondary"
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
          {logoutError && <p className="text-danger mt-2 mb-0" role="alert">{logoutError}</p>}
        </div>
      </header>
      <div className="row g-3">
        {sections.map((section) => (
          <div className="col-12 col-md-6 col-xl-4" key={section.href}>
            <section className="card h-100 shadow-sm">
              <div className="card-body d-flex flex-column">
                <h2 className="h4">{section.name}</h2>
                <p className="text-muted flex-grow-1">{section.description}</p>
                <Link className="btn btn-primary" to={section.href}>
                  Open {section.name}
                </Link>
              </div>
            </section>
          </div>
        ))}
      </div>
    </main>
  )
}
