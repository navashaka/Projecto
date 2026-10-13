import type { ReactNode } from 'react'

type AdminRouteProps = {
  children: ReactNode
  allowPasswordChange?: boolean
}

export default function AdminRoute({ children }: AdminRouteProps) {
  return <>{children}</>
}