import { useNavigate } from 'react-router-dom'
import UserEnquiryForm from '../../../components/auth/UserEnquiryForm'

export default function UserEnquiryPage() {
  const navigate = useNavigate()

  return <UserEnquiryForm onBackToHR={() => navigate('/hr')} />
}
