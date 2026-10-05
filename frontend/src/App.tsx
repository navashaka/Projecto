import './App.css'
import { Route, Routes } from 'react-router-dom'

import LoginPage from './components/auth/LoginPage'
import UserEnquiryForm from './components/auth/UserEnquiryForm'

import Header from './components/layout/Header'
import LeftSidebar from './components/layout/LeftSidebar'
import MainContent from './components/layout/MainContent'
import RightSidebar from './components/layout/RightSidebar'
import Footer from './components/layout/Footer'

import CreateAttendancePage from './modules/hr/pages/attendance/CreateAttendancePage'
import CreateEmploymentDetailsPage from './modules/hr/pages/employment/CreateEmploymentDetailsPage'
import CreateOnEmploymentPage from './modules/hr/pages/on-employment/CreateOnEmploymentPage'
import CreateSalaryDetailsPage from './modules/hr/pages/salary/CreateSalaryDetailsPage'
import CreatePayrollPage from './modules/hr/pages/payroll/CreatePayrollPage'
import CreateTravellingAdvancePage from './modules/hr/pages/travelling-advance/CreateTravellingAdvancePage'

import CreateCompanyProfilePage from './modules/auth/pages/company-profile/CreateCompanyProfilePage'

import JobProfileForm from './modules/hr/components/job-profile/JobProfileForm'
import TravellingExpensesReimbursementForm from './modules/hr/components/travelling-expenses-reimbursement/TravellingExpensesReimbursementForm'
import CompanyHolidayForm from './modules/hr/components/company-holidays/CompanyHolidayForm'

import CostOfElementPage from './modules/admin/CostOfElementPage'

import { useAppStore } from './store'

function DashboardLayout() {
  return (
    <div className="app-shell">
      <Header />

      <div className="app-body">
        <LeftSidebar />
        <MainContent />
        <RightSidebar />
      </div>

      <Footer />
    </div>
  )
}

function App() {
  const isAuthenticated = useAppStore(
    (state) => state.isAuthenticated,
  )

  const showRegisterForm = useAppStore(
    (state) => state.showRegisterForm,
  )

  const login = useAppStore(
    (state) => state.login,
  )

  const toggleRegisterForm = useAppStore(
    (state) => state.toggleRegisterForm,
  )

  if (!isAuthenticated) {
    return showRegisterForm ? (
      <UserEnquiryForm
        onBackToLogin={() => toggleRegisterForm(false)}
      />
    ) : (
      <LoginPage
        onLogin={() =>
          login({
            email: 'user@projecto.com',
            name: 'Projecto User',
            role: 'admin',
          })
        }
        onRegister={() => toggleRegisterForm(true)}
      />
    )
  }

  return (
    <Routes>
      {/* Attendance */}
      <Route
        path="/attendance/create"
        element={<CreateAttendancePage />}
      />

      {/* Employment Details */}
      <Route
        path="/employment/create"
        element={<CreateEmploymentDetailsPage />}
      />

      {/* On Employment */}
      <Route
        path="/on-employment/create"
        element={<CreateOnEmploymentPage />}
      />

      {/* Salary Details */}
      <Route
        path="/salary/create"
        element={<CreateSalaryDetailsPage />}
      />

      {/* Payroll */}
      <Route
        path="/payroll/create"
        element={<CreatePayrollPage />}
      />

      {/* Company Profile */}
      <Route
        path="/company-profile/create"
        element={<CreateCompanyProfilePage />}
      />

      {/* Travelling Advance */}
      <Route
        path="/travelling-advance/create"
        element={<CreateTravellingAdvancePage />}
      />

      {/* Job Profile */}
      <Route
        path="/job-profile/create"
        element={<JobProfileForm />}
      />

      {/* Travelling Expenses Reimbursement */}
      <Route
        path="/travelling-expenses-reimbursement/create"
        element={<TravellingExpensesReimbursementForm />}
      />

      {/* Company Holidays */}
      <Route
        path="/company-holidays/create"
        element={<CompanyHolidayForm />}
      />

      {/* Cost Of Element */}
      <Route
        path="/admin/cost-of-element"
        element={<CostOfElementPage />}
      />

      {/* Dashboard */}
      <Route
        path="*"
        element={<DashboardLayout />}
      />
    </Routes>
  )
}

export default App