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
{ label: 'Dashboard', path: '/' },
{ label: 'Company Profile', path: '/company-profile/create' },
{ label: 'Reports', path: '/admin/reports' },
]

const adminNavigationItems = [
{ label: 'HR Admin', path: '/hr-admin' },
{ label: 'GL Admin', path: '/gl-admin' },
{ label: 'Inventory Admin', path: '/inventory-admin' },
]

const LeftSidebar = () => {
const navigate = useNavigate()
const location = useLocation()
const path = location.pathname

const isHRPage =
path.startsWith('/employment/') ||
path.startsWith('/attendance/') ||
path.startsWith('/payroll/') ||
path.startsWith('/salary/') ||
path.startsWith('/on-employment/') ||
path.startsWith('/travelling-advance/') ||
path.startsWith('/travelling-expenses-reimbursement/') ||
path.startsWith('/job-profile/')

const isInventoryPage = path.startsWith('/inventory')
const isGLPage = path === '/gl' || path.startsWith('/gl/')

const isAdminPage = adminNavigationItems.some(
(item) => path === item.path || path.startsWith("${item.path}/"),
)

const [hrExpanded, setHRExpanded] = useState(isHRPage)
const [inventoryExpanded, setInventoryExpanded] = useState(isInventoryPage)
const [glExpanded, setGLExpanded] = useState(isGLPage)
const [adminExpanded, setAdminExpanded] = useState(isAdminPage)

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

      {/* Admin menu */}
      <div
        className="d-grid gap-2"
        onMouseEnter={() => setAdminExpanded(true)}
        onMouseLeave={() => setAdminExpanded(false)}
      >
        <button
          type="button"
          className="btn btn-light text-start"
          aria-expanded={adminExpanded}
          aria-controls="admin-submenu"
          onClick={() => setAdminExpanded((expanded) => !expanded)}
        >
          Admin
        </button>

        {adminExpanded && (
          <div
            id="admin-submenu"
            className="d-grid gap-2 ms-3 ps-2 border-start"
          >
            {adminNavigationItems.map((item) => (
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

      {/* Existing HR menu */}
      <div
        className="d-grid gap-2"
        onMouseEnter={() => setHRExpanded(true)}
        onMouseLeave={() => setHRExpanded(false)}
      >
        <div className="d-flex gap-1">
          <button
            type="button"
            className="btn btn-light text-start flex-grow-1"
            aria-expanded={hrExpanded}
            aria-controls="hr-submenu"
            onClick={() => setHRExpanded((expanded) => !expanded)}
          >
            HR
          </button>

          {isHRPage && (
            <Tooltip title="Home">
              <IconButton
                aria-label="Go to application home"
                onClick={() => navigate('/')}
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

      {/* Existing Inventory menu */}
      <div
        className="d-grid gap-2"
        onMouseEnter={() => setInventoryExpanded(true)}
        onMouseLeave={() => setInventoryExpanded(false)}
      >
        <button
          type="button"
          className="btn btn-light text-start"
          aria-expanded={inventoryExpanded}
          aria-controls="inventory-submenu"
          onClick={() =>
            setInventoryExpanded((expanded) => !expanded)
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

      {/* Existing General Ledger menu */}
      <div
        className="d-grid gap-2"
        onMouseEnter={() => setGLExpanded(true)}
        onMouseLeave={() => setGLExpanded(false)}
      >
        <button
          type="button"
          className="btn btn-light text-start"
          aria-expanded={glExpanded}
          aria-controls="gl-submenu"
          onClick={() => setGLExpanded((expanded) => !expanded)}
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