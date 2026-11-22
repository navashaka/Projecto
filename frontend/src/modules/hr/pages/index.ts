import type { ComponentType } from 'react'
import {
  AttendancePage,
  BankEnquiryPage,
  CandidateEnquiryPage,
  CompanyHolidaysPage,
  DesignationsPage,
  EmployeesPage,
  LeavePage,
  OnEmploymentPage,
  PayrollPage,
  SalaryPage,
  TravellingAdvancePage,
} from './HRPages'



export const hrPages: Record<string, ComponentType> = {
  'candidate-enquiry': CandidateEnquiryPage,
  'bank-enquiry': BankEnquiryPage,
  attendance: AttendancePage,
  employees: EmployeesPage,
  'company-holidays': CompanyHolidaysPage,
  salary: SalaryPage,
  designations: DesignationsPage,
  payroll: PayrollPage,
  leave: LeavePage,
  'on-employment': OnEmploymentPage,
  'travelling-advance': TravellingAdvancePage,
}