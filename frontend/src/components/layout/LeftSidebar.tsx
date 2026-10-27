import { useState } from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import type { ModuleId, ModulePageSelection } from '../../modules/types'

const menuItems = [
  {
    id: 'hr',
    label: 'HR',
    submenu: [
      { id: 'candidate-enquiry', label: 'Candidate Enquiry' },
      { id: 'bank-enquiry', label: 'Bank Enquiry' },
      { id: 'attendance', label: 'Attendance' },
      { id: 'employees', label: 'Employees' },
      { id: 'company-holidays', label: 'Company Holidays' },
      { id: 'salary', label: 'Salary' },
      { id: 'designations', label: 'Designations' },
      { id: 'payroll', label: 'Payroll' },
      { id: 'leave', label: 'Leave' },
      { id: 'on-employment', label: 'On Employment' },
      { id: 'travelling-advance', label: 'Travelling Advance' }
    ] as const
  },
  {
    id: 'gl',
    label: 'GL',
    submenu: [
      { id: 'customer', label: 'Customer' },
      { id: 'invoice', label: 'Invoice' },
      { id: 'proforma-invoice', label: 'Proforma Invoice' },
      { id: 'quotation', label: 'Quotation' },
      { id: 'tax-invoice', label: 'Tax Invoice' }
    ]
  },
  {
    id: 'ar',
    label: 'AR',
    submenu: [
      { id: 'customer', label: 'Customer' },
      { id: 'invoice', label: 'Invoice' },
      { id: 'proforma-invoice', label: 'Proforma Invoice' },
      { id: 'quotation', label: 'Quotation' },
      { id: 'tax-invoice', label: 'Tax Invoice' }
    ]
  },
  {
    id: 'inventory',
    label: 'Inventory',
    submenu: [
      { id: 'customer', label: 'Customer' },
      { id: 'invoice', label: 'Invoice' },
      { id: 'proforma-invoice', label: 'Proforma Invoice' },
      { id: 'quotation', label: 'Quotation' },
      { id: 'tax-invoice', label: 'Tax Invoice' }
    ]
  }
] as const

type LeftSidebarProps = {
  selection: ModulePageSelection | null
  onSelectPage: (selection: ModulePageSelection) => void
}

const LeftSidebar = ({ selection, onSelectPage }: LeftSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [selectedModule, setSelectedModule] = useState<ModuleId | null>(null)
  const activeModule = menuItems.find(({ id }) => id === selectedModule)

  return (
    <aside
      className={`left-sidebar card border-0 shadow-sm h-100${isCollapsed ? ' is-collapsed' : ''}`}
      aria-label="Module navigation"
    >
      <div className="sidebar-toggle-row">
        {!isCollapsed && <h2 className="sidebar-title sidebar-title-modules">Modules</h2>}
        <button
          type="button"
          className="sidebar-toggle"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!isCollapsed}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed
            ? <PanelLeftOpen size={20} aria-hidden="true" />
            : <PanelLeftClose size={20} aria-hidden="true" />}
        </button>
      </div>
      <nav className="left-sidebar-nav" hidden={isCollapsed}>
        <label className="form-label small fw-semibold mb-1" htmlFor="module-select">
          Module
        </label>
        <select
          id="module-select"
          className="form-select form-select-sm"
          value={selectedModule ?? ''}
          onChange={(event) => {
            const moduleId = menuItems.find(({ id }) => id === event.currentTarget.value)?.id
            setSelectedModule(moduleId ?? null)
          }}
        >
          <option value="" disabled>Select a module</option>
          {menuItems.map(({ id, label }) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>

        {activeModule && (
          <div className="sidebar-forms">
            <h2 className="sidebar-forms-heading">Forms</h2>
            <ul className="sidebar-submenu" aria-label={`${activeModule.label} forms`}>
              {activeModule.submenu.map((option) => {
                const isSelected = selection?.module === activeModule.id && selection.page === option.id

                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      className="sidebar-submenu-item"
                      aria-current={isSelected ? 'page' : undefined}
                      onClick={() => {
                        setSelectedModule(activeModule.id)
                        onSelectPage({
                          module: activeModule.id,
                          page: option.id
                        })
                      }}
                    >
                      {option.label}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </nav>
    </aside>
  )
}

export default LeftSidebar
