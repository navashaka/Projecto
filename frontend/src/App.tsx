import './App.css'
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom'
import { useAppStore } from './store'

import LoginPage from './components/auth/LoginPage'
import UserEnquiryForm from './components/auth/UserEnquiryForm'

import Header from './components/layout/Header'
import LeftSidebar from './components/layout/LeftSidebar'
import MainContent from './components/layout/MainContent'
import RightSidebar from './components/layout/RightSidebar'
import Footer from './components/layout/Footer'

import CreateAttendancePage from './modules/hr/pages/attendance/CreateAttendancePage'
import CreateEmployeePage from './modules/hr/pages/employees/CreateEmployeePage'
import CreateEmploymentDetailsPage from './modules/hr/pages/employment/CreateEmploymentDetailsPage'
import CreateOnEmploymentPage from './modules/hr/pages/on-employment/CreateOnEmploymentPage'
import CreateSalaryDetailsPage from './modules/hr/pages/salary/CreateSalaryDetailsPage'
import CreatePayrollPage from './modules/hr/pages/payroll/CreatePayrollPage'
import CreateTravellingAdvancePage from './modules/hr/pages/travelling-advance/CreateTravellingAdvancePage'
import HRHomePage from './modules/hr/pages/HRHomePage'

import CreateCompanyProfilePage from './modules/auth/pages/company-profile/CreateCompanyProfilePage'

import JobProfileForm from './modules/hr/components/job-profile/JobProfileForm'
import TravellingExpensesReimbursementForm from './modules/hr/components/travelling-expenses-reimbursement/TravellingExpensesReimbursementForm'
import CompanyHolidayForm from './modules/hr/components/company-holidays/CompanyHolidayForm'

import CostOfElementPage from './modules/admin/CostOfElementPage'
import AdminDashboardPage from './modules/admin/AdminDashboardPage'
import PaysheetPage from './modules/admin/PaysheetPage'

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

import HRAdminPage from './modules/hr-admin/HRAdminPage'
import GLAdminPage from './modules/gl-admin/GLAdminPage'
import InventoryAdminPage from './modules/inventory-admin/InventoryAdminPage'

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
  const navigate = useNavigate()

  const isAuthenticated = useAppStore(
    (state) => state.isAuthenticated,
  )
  const setSession = useAppStore((state) => state.login)
  const toggleRegisterForm = useAppStore(
    (state) => state.toggleRegisterForm,
  )
  const showRegisterForm = useAppStore(
    (state) => state.showRegisterForm,
  )

  return (
    <Routes>
      {/* Admin pages: no admin login or logout required */}
      <Route
        path="/admin"
        element={<AdminDashboardPage />}
      />
      <Route
        path="/hr-admin"
        element={<HRAdminPage />}
      />
      <Route
        path="/gl-admin"
        element={<GLAdminPage />}
      />
      <Route
        path="/inventory-admin"
        element={<InventoryAdminPage />}
      />

      {/* Normal user login is preserved */}
      <Route
        path="/login"
        element={
          showRegisterForm ? (
            <UserEnquiryForm
              onBackToLogin={() => toggleRegisterForm(false)}
            />
          ) : (
            <LoginPage
              onLogin={() => {
                setSession({
                  email: 'user@projecto.com',
                  name: 'Projecto User',
                  role: 'user',
                })
                navigate('/', { replace: true })
              }}
              onRegister={() => toggleRegisterForm(true)}
            />
          )
        }
      />

      <Route
        path="/"
        element={
          isAuthenticated ? (
            <DashboardLayout />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Existing HR routes */}
      <Route path="/hr" element={<HRHomePage />} />
      <Route path="/attendance/create" element={<CreateAttendancePage />} />
      <Route path="/employees/create" element={<CreateEmployeePage />} />
      <Route path="/employment/create" element={<CreateEmploymentDetailsPage />} />
      <Route path="/on-employment/create" element={<CreateOnEmploymentPage />} />
      <Route path="/salary/create" element={<CreateSalaryDetailsPage />} />
      <Route path="/payroll/create" element={<CreatePayrollPage />} />
      <Route path="/company-profile/create" element={<CreateCompanyProfilePage />} />
      <Route path="/travelling-advance/create" element={<CreateTravellingAdvancePage />} />
      <Route path="/job-profile/create" element={<JobProfileForm />} />
      <Route
        path="/travelling-expenses-reimbursement/create"
        element={<TravellingExpensesReimbursementForm />}
      />
      <Route path="/company-holidays/create" element={<CompanyHolidayForm />} />

      <Route
        path="/admin/cost-of-element"
        element={<CostOfElementPage />}
      />
      <Route path="/admin/paysheet" element={<PaysheetPage />} />

      {/* Existing Inventory routes */}
      <Route path="/inventory" element={<InventoryHomePage />} />
      <Route path="/inventory/unit-of-measures/create" element={<UnitOfMeasurePage />} />
      <Route path="/inventory/stock-groups/create" element={<StockGroupPage />} />
      <Route path="/inventory/stock-items/create" element={<StockItemPage />} />
      <Route path="/inventory/indents/create" element={<IndentPage />} />
      <Route path="/inventory/gate-entries/create" element={<GateEntryPage />} />
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

      {/* Existing General Ledger routes */}
      <Route path="/gl" element={<GLHomePage />} />
      <Route path="/gl/:resourceKey" element={<GLResourcePage />} />

      {/* Unknown paths */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

export default App