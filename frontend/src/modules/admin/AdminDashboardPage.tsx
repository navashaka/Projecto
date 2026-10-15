import { IconButton, Tooltip } from '@mui/material'
import { Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const sections = [
  { name: 'HR Admin', href: '/hr-admin' },
  { name: 'GL Admin', href: '/gl-admin' },
  { name: 'Inventory Admin', href: '/inventory-admin' },
]

export default function AdminDashboardPage() {
  const navigate = useNavigate()

  return (
    <main className="container py-4">
      <div className="d-flex justify-content-end mb-2">
        <Tooltip title="Home">
          <IconButton
            aria-label="Home"
            onClick={() => navigate('/')}
            color="primary"
          >
            <Home size={24} />
          </IconButton>
        </Tooltip>
      </div>

      <header className="mb-4">
        <h1 className="h2 mb-0">Projecto Admin Dashboard</h1>
      </header>

      <div className="row g-3">
        {sections.map((section) => (
          <div className="col-12 col-md-6 col-xl-4" key={section.href}>
            <section className="card h-100 shadow-sm">
              <div className="card-body d-flex flex-column">
                <h2 className="h4 mb-4">{section.name}</h2>

                <button
                  type="button"
                  className="btn btn-primary mt-auto text-lowercase"
                  onClick={() => navigate(section.href)}
                >
                  Open {section.name}
                </button>
              </div>
            </section>
          </div>
        ))}
      </div>
    </main>
  )
}