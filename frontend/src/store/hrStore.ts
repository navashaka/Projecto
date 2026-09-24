import { create } from 'zustand'

export type HrModuleKey =
  | 'employees'
  | 'attendance'
  | 'leave'
  | 'payroll'
  | 'performance'
  | 'recruitment'
  | 'training'
  | 'departments'
  | 'designations'

export type Employee = {
  id: number
  name: string
  email: string
  department: string
  designation: string
  status: 'active' | 'inactive' | 'probation'
}

export type LeaveRequest = {
  id: number
  employeeName: string
  type: 'annual' | 'sick' | 'casual' | 'maternity'
  days: number
  status: 'pending' | 'approved' | 'rejected'
}

export type PayrollEntry = {
  id: number
  employeeName: string
  month: string
  netPay: number
  status: 'paid' | 'pending'
}

export type RecruitmentCandidate = {
  id: number
  name: string
  position: string
  stage: 'applied' | 'screening' | 'interview' | 'offer'
}

type HrState = {
  activeHrModule: HrModuleKey
  employees: Employee[]
  leaveRequests: LeaveRequest[]
  payrollEntries: PayrollEntry[]
  recruitmentCandidates: RecruitmentCandidate[]
  loading: boolean
  setActiveHrModule: (module: HrModuleKey) => void
  setEmployees: (employees: Employee[]) => void
  addEmployee: (employee: Employee) => void
  updateEmployee: (id: number, employee: Partial<Employee>) => void
  setLeaveRequests: (leaveRequests: LeaveRequest[]) => void
  addLeaveRequest: (leaveRequest: LeaveRequest) => void
  setPayrollEntries: (payrollEntries: PayrollEntry[]) => void
  addPayrollEntry: (entry: PayrollEntry) => void
  setRecruitmentCandidates: (candidates: RecruitmentCandidate[]) => void
  addRecruitmentCandidate: (candidate: RecruitmentCandidate) => void
  setLoading: (value: boolean) => void
  reset: () => void
}

const initialEmployees: Employee[] = [
  {
    id: 1,
    name: 'Asha Verma',
    email: 'asha@projecto.com',
    department: 'Engineering',
    designation: 'Senior Developer',
    status: 'active'
  },
  {
    id: 2,
    name: 'Rohit Nair',
    email: 'rohit@projecto.com',
    department: 'HR',
    designation: 'HR Executive',
    status: 'probation'
  }
]

const initialLeaveRequests: LeaveRequest[] = [
  {
    id: 1,
    employeeName: 'Asha Verma',
    type: 'annual',
    days: 3,
    status: 'pending'
  }
]

const initialPayrollEntries: PayrollEntry[] = [
  {
    id: 1,
    employeeName: 'Asha Verma',
    month: 'September 2026',
    netPay: 85000,
    status: 'paid'
  }
]

const initialRecruitmentCandidates: RecruitmentCandidate[] = [
  {
    id: 1,
    name: 'Meera Shah',
    position: 'Front End Developer',
    stage: 'screening'
  }
]

export const useHrStore = create<HrState>((set) => ({
  activeHrModule: 'employees',
  employees: initialEmployees,
  leaveRequests: initialLeaveRequests,
  payrollEntries: initialPayrollEntries,
  recruitmentCandidates: initialRecruitmentCandidates,
  loading: false,

  setActiveHrModule: (module) => set({ activeHrModule: module }),

  setEmployees: (employees) => set({ employees }),

  addEmployee: (employee) =>
    set((state) => ({
      employees: [...state.employees, employee]
    })),

  updateEmployee: (id, employee) =>
    set((state) => ({
      employees: state.employees.map((item) =>
        item.id === id ? { ...item, ...employee } : item
      )
    })),

  setLeaveRequests: (leaveRequests) => set({ leaveRequests }),

  addLeaveRequest: (leaveRequest) =>
    set((state) => ({
      leaveRequests: [leaveRequest, ...state.leaveRequests]
    })),

  setPayrollEntries: (payrollEntries) => set({ payrollEntries }),

  addPayrollEntry: (entry) =>
    set((state) => ({
      payrollEntries: [entry, ...state.payrollEntries]
    })),

  setRecruitmentCandidates: (candidates) => set({ recruitmentCandidates: candidates }),

  addRecruitmentCandidate: (candidate) =>
    set((state) => ({
      recruitmentCandidates: [candidate, ...state.recruitmentCandidates]
    })),

  setLoading: (value) => set({ loading: value }),

  reset: () =>
    set({
      activeHrModule: 'employees',
      employees: initialEmployees,
      leaveRequests: initialLeaveRequests,
      payrollEntries: initialPayrollEntries,
      recruitmentCandidates: initialRecruitmentCandidates,
      loading: false
    })
}))
