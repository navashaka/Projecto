import {
  Button,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import type { ReactNode } from 'react'
import { Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface ARPageLayoutProps {
  title: string
  children: ReactNode
  isHomePage?: boolean
}

export default function ARPageLayout({
  title,
  children,
  isHomePage = false,
}: ARPageLayoutProps) {
  const navigate = useNavigate()

  return (
    <Stack spacing={3}>
      <div className="d-flex align-items-center justify-content-between">
        <Typography variant="h4">{title}</Typography>
        {isHomePage && (
          <Tooltip title="Home">
            <IconButton
              aria-label="Go to application home"
              onClick={() => navigate('/')}
            >
              <Home size={20} />
            </IconButton>
          </Tooltip>
        )}
      </div>
      {children}
      {!isHomePage && (
        <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
          <Button onClick={() => navigate('/ar')} variant="outlined">
            Back
          </Button>
        </Stack>
      )}
    </Stack>
  )
}
