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
  const isAuthenticated = useAppStore((state) => state.isAuthenticated)
  const showRegisterForm = useAppStore((state) => state.showRegisterForm)
  const login = useAppStore((state) => state.login)
  const toggleRegisterForm = useAppStore((state) => state.toggleRegisterForm)

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

      {/* Cost Element */}
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