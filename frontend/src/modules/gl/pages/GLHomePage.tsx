import { Button, Grid, Paper, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { glResources } from '../constants/glResources'

function GLHomePage() {
  const navigate = useNavigate()

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4">General Ledger</Typography>
      </div>
      <Grid container spacing={2}>
        {glResources.map((resource) => (
          <Grid key={resource.key} size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper sx={{ height: '100%', p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h6">{resource.label}</Typography>
                <Button
                  onClick={() => navigate(`/gl/${resource.key}`)}
                  variant="contained"
                >
                  Open
                </Button>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Stack>
  )
}

export default GLHomePage
