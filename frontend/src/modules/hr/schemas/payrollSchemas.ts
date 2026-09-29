import { z } from 'zod'

export const payrollSchema = z.object({
  basic_salary: z
    .number()
    .min(0, 'Basic salary cannot be negative'),

  allowances: z
    .number()
    .min(0, 'Allowances cannot be negative'),

  other_income: z
    .number()
    .min(0, 'Other income cannot be negative'),

  tds: z
    .number()
    .min(0, 'TDS cannot be negative'),

  other_deductions: z
    .number()
    .min(0, 'Other deductions cannot be negative'),
})

export type PayrollSchemaData = z.infer<
  typeof payrollSchema
>