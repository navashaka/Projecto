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
import UnitOfMeasurePage from './modules/inventory/pages/UnitOfMeasurePage'
import StockGroupPage from './modules/inventory/pages/StockGroupPage'
import StockItemPage from './modules/inventory/pages/StockItemPage'
import IndentPage from './modules/inventory/pages/IndentPage'
import GateEntryPage from './modules/inventory/pages/GateEntryPage'
import MaterialReceiptNotePage from './modules/inventory/pages/MaterialReceiptNotePage'
import DeliveryChallanPage from './modules/inventory/pages/DeliveryChallanPage'
import DeliveryChallanInwardPage from './modules/inventory/pages/DeliveryChallanInwardPage'
import GoodsIssuePage from './modules/inventory/pages/GoodsIssuePage'
import GoodsIssueSalePage from './modules/inventory/pages/GoodsIssueSalePage'
import InventoryHomePage from './modules/inventory/pages/InventoryHomePage'
import GLHomePage from './modules/gl/pages/GLHomePage'
import GLResourcePage from './modules/gl/components/GLResourcePage'

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

      <Route
        path="/inventory"
        element={<InventoryHomePage />}
      />
      <Route
        path="/inventory/unit-of-measures/create"
        element={<UnitOfMeasurePage />}
      />
      <Route
        path="/inventory/stock-groups/create"
        element={<StockGroupPage />}
      />
      <Route
        path="/inventory/stock-items/create"
        element={<StockItemPage />}
      />
      <Route
        path="/inventory/indents/create"
        element={<IndentPage />}
      />
      <Route
        path="/inventory/gate-entries/create"
        element={<GateEntryPage />}
      />
      <Route
        path="/inventory/material-receipt-notes/create"
        element={<MaterialReceiptNotePage />}
      />
      <Route
        path="/inventory/delivery-challans/create"
        element={<DeliveryChallanPage />}
      />
      <Route
        path="/inventory/delivery-challan-inwards/create"
        element={<DeliveryChallanInwardPage />}
      />
      <Route
        path="/inventory/goods-issues/create"
        element={<GoodsIssuePage />}
      />
      <Route
        path="/inventory/goods-issue-sales/create"
        element={<GoodsIssueSalePage />}
      />
      <Route
        path="/gl"
        element={<GLHomePage />}
      />
      <Route
        path="/gl/:resourceKey"
        element={<GLResourcePage />}
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