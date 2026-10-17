import { useNavigate } from 'react-router-dom'
import { Stack } from '@mui/material'
import AdminPageNavigation from './shared/AdminPageNavigation'

const sections = [
  { name: 'AR Admin', href: '/ar-admin' },
  { name: 'GL Admin', href: '/gl-admin' },
  { name: 'HR Admin', href: '/hr-admin' },
  { name: 'Inventory Admin', href: '/inventory-admin' },
]

export default function AdminDashboardPage() {
  const navigate = useNavigate()

  return (
    <main className="container py-4">
      <Stack
        component="header"
        className="mb-4"
        spacing={1.5}
      >
        <h1 className="h2 mb-0 text-center">
          Projecto Admin Dashboard
        </h1>
        <div>
          <AdminPageNavigation homePath="/" showModules={false} />
        </div>
      </Stack>

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