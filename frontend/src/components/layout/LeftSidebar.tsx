import { useState } from 'react'
import { IconButton, Tooltip } from '@mui/material'
import { Home } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { inventoryNavigationItems } from '../../modules/inventory/constants/inventoryConstants'

const glNavigationItems = [
  { label: 'GL Home', path: '/gl' },
  { label: 'GL Groups', path: '/gl/groups' },
  { label: 'GL Accounts', path: '/gl/accounts' },
  { label: 'GL Sundry Creditors', path: '/gl/sundry-creditors' },
  { label: 'GL Sundry Debtors', path: '/gl/sundry-debtors' },
  { label: 'GL Secured Loans', path: '/gl/secured-loans' },
  { label: 'GL Unsecured Loans', path: '/gl/unsecured-loans' },
  { label: 'GL Bank Accounts', path: '/gl/bank-accounts' },
  { label: 'GL Cheque Ranges', path: '/gl/cheque-ranges' },
  { label: 'GL HSN Master', path: '/gl/hsn-masters' },
  { label: 'GL SAC Master', path: '/gl/sac-masters' },
  { label: 'GL Tax Types', path: '/gl/tax-types' },
  { label: 'GL OD Limits', path: '/gl/od-limits' },
]

const hrNavigationItems = [
  { label: 'Employees', path: '/employment/create' },
  { label: 'Attendance', path: '/attendance/create' },
  { label: 'Payroll', path: '/payroll/create' },
]

const menuItems = [
  { label: 'Dashboard', path: '/admin' },
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
  const isHRPage =
    location.pathname.startsWith('/employment/') ||
    location.pathname.startsWith('/attendance/') ||
    location.pathname.startsWith('/payroll/') ||
    location.pathname.startsWith('/salary/') ||
    location.pathname.startsWith('/on-employment/') ||
    location.pathname.startsWith('/travelling-advance/') ||
    location.pathname.startsWith('/travelling-expenses-reimbursement/') ||
    location.pathname.startsWith('/job-profile/')
  const [hrMenu, setHRMenu] = useState(() => ({
    pathname: location.pathname,
    expanded: isHRPage,
  }))
  const [inventoryMenu, setInventoryMenu] = useState(() => ({
    pathname: location.pathname,
    expanded: isInventoryPage,
  }))
  const isGLPage = location.pathname === '/gl' || location.pathname.startsWith('/gl/')
  const [glMenu, setGLMenu] = useState(() => ({
    pathname: location.pathname,
    expanded: isGLPage,
  }))

  if (inventoryMenu.pathname !== location.pathname) {
    setInventoryMenu({
      pathname: location.pathname,
      expanded: isInventoryPage,
    })
  }

  if (hrMenu.pathname !== location.pathname) {
    setHRMenu({
      pathname: location.pathname,
      expanded: isHRPage,
    })
  }
  const hrExpanded = hrMenu.expanded
  const inventoryExpanded = inventoryMenu.expanded
  if (glMenu.pathname !== location.pathname) {
    setGLMenu({
      pathname: location.pathname,
      expanded: isGLPage,
    })
  }
  const glExpanded = glMenu.expanded

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

          <div
            className="d-grid gap-2"
            onMouseEnter={() =>
              setHRMenu({
                pathname: location.pathname,
                expanded: true,
              })
            }
            onMouseLeave={() =>
              setHRMenu({
                pathname: location.pathname,
                expanded: false,
              })
            }
          >
            <div className="d-flex gap-1">
              <button
                type="button"
                className="btn btn-light text-start d-flex flex-grow-1 align-items-center justify-content-between"
                aria-expanded={hrExpanded}
                aria-controls="hr-submenu"
                onClick={() =>
                  setHRMenu({
                    pathname: location.pathname,
                    expanded: !hrExpanded,
                  })
                }
              >
                HR
              </button>
              {isHRPage && (
                <Tooltip title="Home">
                  <IconButton
                    aria-label="Go to application home"
                    onClick={() => navigate('/admin')}
                    size="small"
                  >
                    <Home size={18} />
                  </IconButton>
                </Tooltip>
              )}
            </div>

            {hrExpanded && (
              <div
                id="hr-submenu"
                className="d-grid gap-2 ms-3 ps-2 border-start"
              >
                {hrNavigationItems.map((item) => (
                  <button
                    key={item.path}
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

          <div
            className="d-grid gap-2"
            onMouseEnter={() =>
              setInventoryMenu({
                pathname: location.pathname,
                expanded: true,
              })
            }
            onMouseLeave={() =>
              setInventoryMenu({
                pathname: location.pathname,
                expanded: false,
              })
            }
          >
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

          <div
            className="d-grid gap-2"
            onMouseEnter={() =>
              setGLMenu({
                pathname: location.pathname,
                expanded: true,
              })
            }
            onMouseLeave={() =>
              setGLMenu({
                pathname: location.pathname,
                expanded: false,
              })
            }
          >
            <button
              type="button"
              className="btn btn-light text-start d-flex align-items-center justify-content-between"
              aria-expanded={glExpanded}
              aria-controls="gl-submenu"
              onClick={() =>
                setGLMenu({
                  pathname: location.pathname,
                  expanded: !glExpanded,
                })
              }
            >
              General Ledger
            </button>

            {glExpanded && (
              <div
                id="gl-submenu"
                className="d-grid gap-2 ms-3 ps-2 border-start"
              >
                {glNavigationItems.map((item) => (
                  <button
                    key={item.path}
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

      </div>
    </aside>
  )
}

export default LeftSidebar