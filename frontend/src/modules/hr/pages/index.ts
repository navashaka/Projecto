import type { ComponentType } from 'react'
import {
  AttendancePage,
  BankEnquiryPage,
  CompanyHolidaysPage,
  DesignationsPage,
  EmployeesPage,
  LeavePage,
  OnEmploymentPage,
  PayrollPage,
  SalaryPage,
  TravellingAdvancePage,
  UserEnquiryPage
} from './HRPages'

export const hrPages: Record<string, ComponentType> = {
  'user-enquiry': UserEnquiryPage,
  'bank-enquiry': BankEnquiryPage,
  attendance: AttendancePage,
  employees: EmployeesPage,
  'company-holidays': CompanyHolidaysPage,
  salary: SalaryPage,
  designations: DesignationsPage,
  payroll: PayrollPage,
  leave: LeavePage,
  'on-employment': OnEmploymentPage,
  'travelling-advance': TravellingAdvancePage
}
