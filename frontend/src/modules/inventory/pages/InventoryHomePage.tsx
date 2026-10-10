import {
  Button,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { inventoryNavigationItems } from '../constants/inventoryConstants'

function InventoryHomePage() {
  const navigate = useNavigate()

  return (
    <Stack spacing={3}>
      <div className="d-flex align-items-center justify-content-between">
        <Typography variant="h4">Inventory</Typography>
        <Tooltip title="Home">
          <IconButton
            aria-label="Go to application home"
            onClick={() => navigate('/admin')}
          >
            <Home size={20} />
          </IconButton>
        </Tooltip>
      </div>
      <Grid container spacing={2}>
        {inventoryNavigationItems.map((item) => (
          <Grid key={item.path} size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h6">{item.label}</Typography>
                <Button
                  onClick={() => navigate(item.path)}
                  variant="contained"
                >
                  Open form
                </Button>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Stack>
  )
}

export default InventoryHomePage
