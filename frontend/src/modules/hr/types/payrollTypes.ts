export type PayrollFormData = {
  basic_salary: number
  allowances: number
  other_income: number
  tds: number
  other_deductions: number
}

export type PayrollCalculationResult = {
  gross_salary: number
  employee_epf: number
  employee_esi: number
  total_deductions: number
  net_salary: number
}