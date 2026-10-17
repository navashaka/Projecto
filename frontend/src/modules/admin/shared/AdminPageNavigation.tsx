import { Button, IconButton, Menu, MenuItem, Tooltip } from '@mui/material'
import { ChevronDown, Home } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const adminPages = [
  { label: 'AR Admin', path: '/ar-admin' },
  { label: 'GL Admin', path: '/gl-admin' },
  { label: 'HR Admin', path: '/hr-admin' },
  { label: 'Inventory Admin', path: '/inventory-admin' },
]

type AdminPageNavigationProps = {
  homePath: string
  showModules?: boolean
}

export default function AdminPageNavigation({
  homePath,
  showModules = true,
}: AdminPageNavigationProps) {
  const navigate = useNavigate()
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)

  return (
    <>
      <div className="d-flex align-items-center gap-1">
        <Tooltip title="Home">
          <IconButton
            aria-label="Home"
            color="primary"
            onClick={() => navigate(homePath)}
          >
            <Home size={24} />
          </IconButton>
        </Tooltip>
        {showModules && (
          <Button
            aria-controls={menuAnchor ? 'admin-module-menu' : undefined}
            aria-expanded={menuAnchor ? 'true' : undefined}
            aria-haspopup="true"
            endIcon={<ChevronDown size={18} />}
            onClick={(event) => setMenuAnchor(event.currentTarget)}
          >
            Admin Modules
          </Button>
        )}
      </div>
      {showModules && (
        <Menu
          anchorEl={menuAnchor}
          id="admin-module-menu"
          onClose={() => setMenuAnchor(null)}
          open={Boolean(menuAnchor)}
        >
          {adminPages.map((page) => (
            <MenuItem
              key={page.path}
              onClick={() => {
                setMenuAnchor(null)
                navigate(page.path)
              }}
            >
              {page.label}
            </MenuItem>
          ))}
        </Menu>
      )}
    </>
  )
}
