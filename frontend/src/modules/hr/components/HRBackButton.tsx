import { Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'

function HRBackButton() {
  const navigate = useNavigate()

  return (
    <Button
      onClick={() => navigate('/hr')}
      type="button"
      variant="outlined"
      sx={{ textTransform: 'lowercase' }}
    >
      Back
    </Button>
  )
}

export default HRBackButton
