import UserEnquiryForm from '../../../components/auth/UserEnquiryForm'
import ModuleDataPage from '../../shared/ModuleDataPage'

export const UserEnquiryPage = () => <UserEnquiryForm />

export const BankEnquiryPage = () => (
  <ModuleDataPage
    module="hr"
    title="Bank Enquiry"
    fields={[
      { name: 'accountName', label: 'Name as per bank account', section: 'Bank Account Details' },
      { name: 'accountNumber', label: 'Account number' },
      { name: 'bank', label: 'Bank' },
      { name: 'branch', label: 'Branch' },
      { name: 'ifsc', label: 'IFSC' },
      { name: 'salaryOfferedCtc', label: 'Salary offered CTC', type: 'number', section: 'Salary Offered CTC' },
      { name: 'yearlyIncrement', label: 'Yearly increment', type: 'number', required: false },
      { name: 'incrementYear', label: 'Year', type: 'number', required: false },
      { name: 'basic', label: 'Basic', type: 'number', section: 'Break-up of Salary' },
      { name: 'allowance1', label: 'Allowance 1', type: 'number', required: false },
      { name: 'allowance2', label: 'Allowance 2', type: 'number', required: false },
      { name: 'allowance3', label: 'Allowance 3', type: 'number', required: false },
      { name: 'allowance4', label: 'Allowance 4', type: 'number', required: false },
      { name: 'allowance5', label: 'Allowance 5', type: 'number', required: false },
      { name: 'allowance6', label: 'Allowance 6', type: 'number', required: false },
      { name: 'additionalAllowanceName', label: 'Additional allowance name', required: false },
      { name: 'additionalAllowance', label: 'Additional allowance amount', type: 'number', required: false },
      { name: 'arrears', label: 'Arrears', type: 'number', required: false },
      { name: 'gross', label: 'Gross', type: 'number' },
      { name: 'epf', label: 'EPF', type: 'number', required: false, section: 'Deductions' },
      { name: 'esiInsurance', label: 'ESI / Insurance', type: 'number', required: false },
      { name: 'tds', label: 'TDS', type: 'number', required: false },
      { name: 'canteenDeductions', label: 'Canteen deductions', type: 'number', required: false },
      { name: 'advance', label: 'Advance', type: 'number', required: false },
      { name: 'loanEmi', label: 'Loan EMI', type: 'number', required: false },
      { name: 'otherDeductionName', label: 'Other deduction name', required: false },
      { name: 'otherDeduction', label: 'Other deduction amount', type: 'number', required: false },
      { name: 'totalDeductions', label: 'Total deductions', type: 'number' },
      { name: 'netSalary', label: 'Net salary', type: 'number', section: 'Net Salary' },
      { name: 'employerEpfShare', label: 'EPF - Employer share', type: 'number', required: false, section: 'Add Employer Contributions' },
      { name: 'employerEsiShare', label: 'ESI - Employer share', type: 'number', required: false },
      { name: 'employerInsurance', label: 'Insurance - Employer share', type: 'number', required: false },
      { name: 'transportAllowance', label: 'Transport allowance', type: 'number', required: false },
      { name: 'canteenAllowance', label: 'Canteen allowance', type: 'number', required: false },
      { name: 'bonus', label: 'Bonus', type: 'number', required: false },
      { name: 'otherContributionName', label: 'Other employer contribution name', required: false },
      { name: 'otherContribution', label: 'Other employer contribution amount', type: 'number', required: false },
      { name: 'totalCtc', label: 'Total CTC', type: 'number', section: 'Total CTC' }
    ]}
  />
)

export const AttendancePage = () => (
  <ModuleDataPage
    module="hr"
    title="Attendance"
    fields={[
      { name: 'employeeCode', label: 'Employee code' },
      { name: 'employeeName', label: 'Employee name' },
      { name: 'attendanceDate', label: 'Attendance date', type: 'date' },
      { name: 'checkIn', label: 'Check-in time', type: 'time', required: false },
      { name: 'checkOut', label: 'Check-out time', type: 'time', required: false },
      { name: 'status', label: 'Attendance status', type: 'select', options: ['Present', 'Absent', 'Half day', 'Work from home', 'On duty'] },
      { name: 'remarks', label: 'Remarks', type: 'textarea', required: false }
    ]}
  />
)

export const EmployeesPage = () => (
  <ModuleDataPage
    module="hr"
    title="Employees"
    fields={[
      { name: 'employeeId', label: 'Employee ID' },
      { name: 'name', label: 'Employee name' },
      { name: 'dateOfBirth', label: 'Date of birth', type: 'date' },
      { name: 'bloodGroup', label: 'Blood group', required: false },
      { name: 'maritalStatus', label: 'Marital status', type: 'select', options: ['Single', 'Married', 'Divorced', 'Widowed'] },
      { name: 'phone', label: 'Phone', type: 'tel' },
      { name: 'personalEmail', label: 'Personal email', type: 'email' },
      { name: 'address', label: 'Address', type: 'textarea' },
      { name: 'pan', label: 'PAN' },
      { name: 'aadhaar', label: 'Aadhaar' },
      { name: 'passportNumber', label: 'Passport number', required: false },
      { name: 'emergencyContact', label: 'Emergency contact phone' },
      { name: 'nationality', label: 'Nationality' },
      { name: 'highestQualification', label: 'Highest qualification' },
      { name: 'yearOfPass', label: 'Year of passing', type: 'number' },
      { name: 'department', label: 'Department' },
      { name: 'designation', label: 'Designation' }
    ]}
  />
)

export const CompanyHolidaysPage = () => (
  <ModuleDataPage
    module="hr"
    title="Company Holidays"
    fields={[
      { name: 'holidayName', label: 'Holiday name' },
      { name: 'holidayDate', label: 'Holiday date', type: 'date' },
      { name: 'location', label: 'Location / office' },
      { name: 'holidayType', label: 'Holiday type', type: 'select', options: ['Public holiday', 'Company holiday', 'Optional holiday'] },
      { name: 'description', label: 'Description', type: 'textarea', required: false }
    ]}
  />
)

export const SalaryPage = () => (
  <ModuleDataPage
    module="hr"
    title="Salary"
    fields={[
      { name: 'employeeCode', label: 'Employee code' },
      { name: 'employeeName', label: 'Employee name' },
      { name: 'month', label: 'Salary month', type: 'month' },
      { name: 'salaryOfferedCtc', label: 'Salary offered CTC', type: 'number' },
      { name: 'yearlyIncrement', label: 'Yearly increment', type: 'number', required: false },
      { name: 'basic', label: 'Basic salary', type: 'number' },
      { name: 'allowance1', label: 'Allowance 1', type: 'number', required: false },
      { name: 'allowance2', label: 'Allowance 2', type: 'number', required: false },
      { name: 'allowance3', label: 'Allowance 3', type: 'number', required: false },
      { name: 'allowance4', label: 'Allowance 4', type: 'number', required: false },
      { name: 'allowance5', label: 'Allowance 5', type: 'number', required: false },
      { name: 'allowance6', label: 'Allowance 6', type: 'number', required: false },
      { name: 'arrears', label: 'Arrears', type: 'number', required: false },
      { name: 'gross', label: 'Gross salary', type: 'number' },
      { name: 'epf', label: 'EPF deduction', type: 'number', required: false },
      { name: 'esiInsurance', label: 'ESI / insurance deduction', type: 'number', required: false },
      { name: 'tds', label: 'TDS', type: 'number', required: false },
      { name: 'canteenDeductions', label: 'Canteen deductions', type: 'number', required: false },
      { name: 'advance', label: 'Advance deduction', type: 'number', required: false },
      { name: 'loanEmi', label: 'Loan EMI', type: 'number', required: false },
      { name: 'totalDeductions', label: 'Total deductions', type: 'number' },
      { name: 'netSalary', label: 'Net salary', type: 'number' },
      { name: 'employerEpf', label: 'Employer EPF share', type: 'number', required: false },
      { name: 'employerEsi', label: 'Employer ESI share', type: 'number', required: false },
      { name: 'employerInsurance', label: 'Employer insurance share', type: 'number', required: false },
      { name: 'transportAllowance', label: 'Transport allowance', type: 'number', required: false },
      { name: 'canteenAllowance', label: 'Canteen allowance', type: 'number', required: false },
      { name: 'bonus', label: 'Bonus', type: 'number', required: false },
      { name: 'totalCtc', label: 'Total CTC', type: 'number' }
    ]}
  />
)

export const DesignationsPage = () => (
  <ModuleDataPage
    module="hr"
    title="Designations"
    fields={[
      { name: 'designationCode', label: 'Designation code' },
      { name: 'designation', label: 'Designation name' },
      { name: 'department', label: 'Department' },
      { name: 'reportingHead', label: 'Immediate reporting head', required: false },
      { name: 'responsibilities', label: 'Role and responsibilities', type: 'textarea' },
      { name: 'description', label: 'Description', type: 'textarea', required: false }
    ]}
  />
)

export const PayrollPage = () => (
  <ModuleDataPage
    module="hr"
    title="Payroll"
    fields={[
      { name: 'employeeCode', label: 'Employee code' },
      { name: 'employeeName', label: 'Employee name' },
      { name: 'payPeriod', label: 'Payroll month', type: 'month' },
      { name: 'basic', label: 'Basic', type: 'number' },
      { name: 'allowance1', label: 'Allowance 1', type: 'number', required: false },
      { name: 'allowance2', label: 'Allowance 2', type: 'number', required: false },
      { name: 'allowance3', label: 'Allowance 3', type: 'number', required: false },
      { name: 'allowance4', label: 'Allowance 4', type: 'number', required: false },
      { name: 'allowance5', label: 'Allowance 5', type: 'number', required: false },
      { name: 'allowance6', label: 'Allowance 6', type: 'number', required: false },
      { name: 'arrears', label: 'Arrears', type: 'number', required: false },
      { name: 'grossPay', label: 'Gross pay', type: 'number' },
      { name: 'epf', label: 'EPF deduction', type: 'number', required: false },
      { name: 'esiInsurance', label: 'ESI / insurance deduction', type: 'number', required: false },
      { name: 'tds', label: 'TDS', type: 'number', required: false },
      { name: 'canteenDeduction', label: 'Canteen deduction', type: 'number', required: false },
      { name: 'advanceDeduction', label: 'Advance deduction', type: 'number', required: false },
      { name: 'loanEmi', label: 'Loan EMI', type: 'number', required: false },
      { name: 'totalDeductions', label: 'Total deductions', type: 'number' },
      { name: 'netPay', label: 'Net pay', type: 'number' }
    ]}
  />
)

export const LeavePage = () => (
  <ModuleDataPage
    module="hr"
    title="Leave"
    fields={[
      { name: 'employeeCode', label: 'Employee code' },
      { name: 'employeeName', label: 'Employee name' },
      { name: 'leaveType', label: 'Leave type', type: 'select', options: ['Annual leave', 'Sick leave', 'Casual leave', 'Unpaid leave', 'Other'] },
      { name: 'startDate', label: 'Start date', type: 'date' },
      { name: 'endDate', label: 'End date', type: 'date' },
      { name: 'reason', label: 'Reason', type: 'textarea' },
      { name: 'status', label: 'Approval status', type: 'select', options: ['Pending', 'Approved', 'Rejected'] }
    ]}
  />
)

export const OnEmploymentPage = () => (
  <ModuleDataPage
    module="hr"
    title="On Employment"
    fields={[
      { name: 'employeeCode', label: 'Employee code' },
      { name: 'designation', label: 'Designation' },
      { name: 'department', label: 'Department' },
      { name: 'reportingHead', label: 'Immediate reporting head' },
      { name: 'departmentHead', label: 'Department head' },
      { name: 'epfUan', label: 'EPF-UAN', required: false },
      { name: 'esi', label: 'ESI number', required: false },
      { name: 'healthInsurance', label: 'Health insurance details', required: false },
      { name: 'healthInsuranceDate', label: 'Date', type: 'date', required: false },
      { name: 'workEmail', label: 'Work email allotted', type: 'email' }
    ]}
  />
)

export const TravellingAdvancePage = () => (
  <ModuleDataPage
    module="hr"
    title="Travelling Advance"
    fields={[
      { name: 'employeeCode', label: 'Employee code' },
      { name: 'employeeName', label: 'Employee name' },
      { name: 'requestDate', label: 'Request date', type: 'date' },
      { name: 'travelDate', label: 'Travel date', type: 'date' },
      { name: 'returnDate', label: 'Return date', type: 'date', required: false },
      { name: 'destination', label: 'Destination' },
      { name: 'purpose', label: 'Purpose of travel', type: 'textarea' },
      { name: 'amount', label: 'Advance amount', type: 'number' },
      { name: 'status', label: 'Approval status', type: 'select', options: ['Pending', 'Approved', 'Rejected', 'Settled'] },
      { name: 'remarks', label: 'Remarks', type: 'textarea', required: false }
    ]}
  />
)
