import './App.css'
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { useEffect } from 'react'

import LoginPage from './components/auth/LoginPage'
import AdminLoginPage from './components/auth/AdminLoginPage'
import ChangePasswordPage from './components/auth/ChangePasswordPage'
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
import AdminDashboardPage from './modules/admin/AdminDashboardPage'

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

import HRAdminPage from './modules/hr-admin/HRAdminPage'
import GLAdminPage from './modules/gl-admin/GLAdminPage'
import InventoryAdminPage from './modules/inventory-admin/InventoryAdminPage'

import AdminRoute from './routes/AdminRoute'
import { loginAdmin, logoutAdmin } from './services/authApi'

function getLoginError(error: unknown): Error {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const response = error.response

    if (
      typeof response === 'object' &&
      response !== null &&
      'data' in response
    ) {
      const data = response.data

      if (
        typeof data === 'object' &&
        data !== null &&
        'detail' in data &&
        typeof data.detail === 'string'
      ) {
        return new Error(data.detail)
      }
    }
  }

  return error instanceof Error
    ? error
    : new Error('Unable to sign in.')
}

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
  const location = useLocation()

  const isAuthenticated = useAppStore(
    (state) => state.isAuthenticated,
  )
  const session = useAppStore((state) => state.session)
  const showRegisterForm = useAppStore(
    (state) => state.showRegisterForm,
  )
  const setSession = useAppStore((state) => state.login)
  const toggleRegisterForm = useAppStore(
    (state) => state.toggleRegisterForm,
  )
  const logout = useAppStore((state) => state.logout)

  const isAdmin = session?.role === 'admin'
  const isUser = isAuthenticated && session?.role !== 'admin'
  const path = location.pathname

  useEffect(() => {
    if (
      !isAuthenticated &&
      path !== '/login' &&
      path !== '/admin-login'
    ) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, path, navigate])

  const handleAdminLogin = async (
    email: string,
    password: string,
  ) => {
    try {
      const response = await loginAdmin(email, password)

      setSession({
        email: response.email,
        role: response.role,
        accessToken: response.access_token,
        mustChangePassword: response.must_change_password,
      })

      navigate(
        response.must_change_password
          ? '/change-password'
          : '/admin',
        { replace: true },
      )
    } catch (error) {
      throw getLoginError(error)
    }
  }

  const endAdminSession = async () => {
    try {
      await logoutAdmin()
    } finally {
      logout()
      navigate('/login', { replace: true })
    }
  }

  // Normal login page
  if (path === '/login') {
    if (isAdmin) {
      return (
        <Navigate
          to={session?.mustChangePassword ? '/change-password' : '/admin'}
          replace
        />
      )
    }

    if (isUser) {
      return <Navigate to="/" replace />
    }

    if (showRegisterForm) {
      return (
        <UserEnquiryForm
          onBackToLogin={() => toggleRegisterForm(false)}
        />
      )
    }

    return (
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

  // Separate administrator login page
  if (path === '/admin-login') {
    if (isAdmin) {
      return (
        <Navigate
          to={session?.mustChangePassword ? '/change-password' : '/admin'}
          replace
        />
      )
    }

    return (
      <AdminLoginPage
        onLogin={handleAdminLogin}
        onBack={() => navigate('/login', { replace: true })}
      />
    )
  }

  // Protect all other routes from unauthenticated access
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAdmin
            ? <Navigate to="/admin" replace />
            : <DashboardLayout />
        }
      />

      <Route
        path="/change-password"
        element={
          <AdminRoute allowPasswordChange>
            <ChangePasswordPage
              onPasswordChanged={(response) => {
                setSession({
                  email: response.email,
                  role: response.role,
                  accessToken: response.access_token,
                  mustChangePassword: false,
                })
                navigate('/admin', { replace: true })
              }}
              onLogout={endAdminSession}
            />
          </AdminRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboardPage
              email={session?.email ?? ''}
              onLogout={endAdminSession}
            />
          </AdminRoute>
        }
      />

      <Route path="/attendance/create" element={<CreateAttendancePage />} />
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
        element={
          <AdminRoute>
            <CostOfElementPage />
          </AdminRoute>
        }
      />

      <Route
        path="/hr-admin"
        element={
          <AdminRoute>
            <HRAdminPage />
          </AdminRoute>
        }
      />

      <Route
        path="/gl-admin"
        element={
          <AdminRoute>
            <GLAdminPage />
          </AdminRoute>
        }
      />

      <Route
        path="/inventory-admin"
        element={
          <AdminRoute>
            <InventoryAdminPage />
          </AdminRoute>
        }
      />

      <Route path="/inventory" element={<InventoryHomePage />} />
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

      <Route path="/gl" element={<GLHomePage />} />
      <Route path="/gl/:resourceKey" element={<GLResourcePage />} />

      <Route
        path="*"
        element={
          isAdmin
            ? <Navigate to="/admin" replace />
            : <DashboardLayout />
        }
      />
    </Routes>
  )
}

export default App