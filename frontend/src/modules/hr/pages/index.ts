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
} from './HRPages'

import UserEnquiryForm from '../../../components/auth/UserEnquiryForm'

export const hrPages: Record<string, ComponentType> = {
  'candidate-enquiry': UserEnquiryForm,
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