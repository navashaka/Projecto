import {
  Button,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { arPages } from '../constants/arResources'
import ARPageLayout from './ARPageLayout'

export default function ARHomePage() {
  const navigate = useNavigate()

  return (
    <ARPageLayout isHomePage title="Accounts Receivable">
      <Grid container spacing={2}>
        {arPages.map((page) => (
          <Grid key={page.path} size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper sx={{ height: '100%', p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h6">{page.label}</Typography>
                <Button
                  onClick={() => navigate(page.path)}
                  sx={{ textTransform: 'none' }}
                  variant="contained"
                >
                  Open
                </Button>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </ARPageLayout>
  )
}
