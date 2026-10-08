import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { inventoryNavigationItems } from '../../modules/inventory/constants/inventoryConstants'

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
    path: '/payroll/create',
  },
  {
    label: 'Company Profile',
    path: '/company-profile/create',
  },
  {
    label: 'Reports',
    path: '/admin/reports',
  },
]

const LeftSidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const isInventoryPage = location.pathname.startsWith('/inventory/')
  const [inventoryMenu, setInventoryMenu] = useState(() => ({
    pathname: location.pathname,
    expanded: isInventoryPage,
  }))

  if (inventoryMenu.pathname !== location.pathname) {
    setInventoryMenu({
      pathname: location.pathname,
      expanded: isInventoryPage,
    })
  }

  const inventoryExpanded = inventoryMenu.expanded

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

          <button
            type="button"
            className="btn btn-light text-start d-flex align-items-center justify-content-between"
            aria-expanded={inventoryExpanded}
            aria-controls="inventory-submenu"
            onClick={() =>
              setInventoryMenu({
                pathname: location.pathname,
                expanded: !inventoryExpanded,
              })
            }
          >
            Inventory
          </button>

          {inventoryExpanded && (
            <div
              id="inventory-submenu"
              className="d-grid gap-2 ms-3 ps-2 border-start"
            >
              {inventoryNavigationItems.map((item) => (
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
          )}
        </div>

      </div>
    </aside>
  )
}

export default LeftSidebar