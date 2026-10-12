import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { getAdminIdentity } from '../services/authApi'
import { useAppStore } from '../store'

type AdminRouteProps = {
  children: ReactNode
  allowPasswordChange?: boolean
}

export default function AdminRoute({
  children,
  allowPasswordChange = false,
}: AdminRouteProps) {
  const session = useAppStore((state) => state.session)
  const logout = useAppStore((state) => state.logout)
  const [verification, setVerification] = useState<
    { token: string; status: 'checking' | 'allowed'; mustChange: boolean }
  >(() => ({
    token: session?.accessToken ?? '',
    status: 'checking',
    mustChange: false,
  }))
  const token = session?.accessToken

  useEffect(() => {
    let active = true
    if (!token || session?.role !== 'admin') return

    getAdminIdentity()
      .then((identity) => {
        if (active) {
          setVerification({
            token,
            status: 'allowed',
            mustChange: identity.must_change_password,
          })
        }
      })
      .catch(() => {
        if (active) logout()
      })
    return () => {
      active = false
    }
  }, [logout, session?.role, token])

  if (session?.role !== 'admin' || !token) {
    return <Navigate to="/login" replace />
  }
  if (verification.token !== token || verification.status === 'checking') {
    return <div className="container py-5" role="status">Verifying administrator session...</div>
  }
  if (verification.mustChange && !allowPasswordChange) {
    return <Navigate to="/change-password" replace />
  }
  if (allowPasswordChange && verification.mustChange === false) {
    return children
  }

  return children
}
