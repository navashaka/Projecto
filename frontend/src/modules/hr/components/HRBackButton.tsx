import { Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'

function HRBackButton() {
  const navigate = useNavigate()

  return (
    <Button
      onClick={() => navigate(-1)}
      type="button"
      variant="outlined"
    >
      Back
    </Button>
  )
}

export default HRBackButton
