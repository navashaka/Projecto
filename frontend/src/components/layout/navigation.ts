import type { UserRole } from '../../store'

export const navigationByRole: Record<UserRole, { sidebar: string[] }> = {
  admin: {
    sidebar: ['Dashboard', 'Employees', 'Attendance', 'Payroll', 'Recruitment', 'Reports']
  },
  customer: {
    sidebar: ['Dashboard', 'Invoices', 'Payments', 'Reports']
  },
  employee: {
    sidebar: ['Dashboard', 'Attendance', 'Payroll', 'Reports']
  }
}
