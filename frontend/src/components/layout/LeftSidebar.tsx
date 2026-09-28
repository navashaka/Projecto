import { useNavigate } from 'react-router-dom'

const menuItems = [
  {
    label: 'Dashboard',
    path: '/admin',
  },
  {
    label: 'Employees',
    path: '/employment/create',
  },
  {
    label: 'Attendance',
    path: '/attendance/create',
  },
  {
    label: 'Payroll',
    path: '/admin/paysheet',
  },
  {
    label: 'Reports',
    path: '/admin/reports',
  },
]

const LeftSidebar = () => {
  const navigate = useNavigate()

  return (
    <aside className="card border-0 shadow-sm h-100">
      <div className="card-body p-3">

        <p className="text-uppercase text-muted small fw-semibold mb-3">
          Menu
        </p>

        <div className="d-grid gap-2">
          {menuItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className="btn btn-light text-start"
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </div>

      </div>
    </aside>
  )
}

export default LeftSidebar