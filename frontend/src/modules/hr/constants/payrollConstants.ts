export const PAYROLL_FIELDS = {
  BASIC_SALARY: 'basic_salary',
  ALLOWANCES: 'allowances',
  OTHER_INCOME: 'other_income',
  TDS: 'tds',
  OTHER_DEDUCTIONS: 'other_deductions',
} as const

export const PAYROLL_LABELS = {
  basic_salary: 'Basic Salary',
  allowances: 'Allowances',
  other_income: 'Other Income',
  tds: 'TDS',
  other_deductions: 'Other Deductions',
  gross_salary: 'Gross Salary',
  employee_epf: 'Employee EPF',
  employee_esi: 'Employee ESI',
  total_deductions: 'Total Deductions',
  net_salary: 'Net Salary',
} as const