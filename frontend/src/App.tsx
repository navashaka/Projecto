import { useEffect, useState } from 'react'
import './App.css'
import LoginPage from './components/auth/LoginPage'
import UserEnquiryForm from './components/auth/UserEnquiryForm'
import Header from './components/layout/Header'
import LeftSidebar from './components/layout/LeftSidebar'
import MainContent from './components/layout/MainContent'
import RightSidebar from './components/layout/RightSidebar'
import Footer from './components/layout/Footer'
import { useAppStore } from './store'
import type { ModulePageSelection } from './modules/types'

function App() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated)
  const showRegisterForm = useAppStore((state) => state.showRegisterForm)
  const login = useAppStore((state) => state.login)
  const toggleRegisterForm = useAppStore((state) => state.toggleRegisterForm)
  const [selectedPage, setSelectedPage] = useState<ModulePageSelection | null>(null)

  useEffect(() => {
    sessionStorage.clear()
  }, [])

  // useEffect(() => {
  //   window.onbeforeunload = () => (isAuthenticated ? true : null)

  //   return () => {
  //     window.onbeforeunload = null
  //   }
  // }, [isAuthenticated])

  // if (!isAuthenticated) {
  //   return showRegisterForm ? (
  //     <UserEnquiryForm onBackToLogin={() => toggleRegisterForm(false)} />
  //   ) : (
  //     <LoginPage
  //       onLogin={login}
  //       onRegister={() => toggleRegisterForm(true)}
  //     />
  //   )
  // }
  return (
    <div className="app-shell">
      <Header />

      <div className="app-body">
        <LeftSidebar selection={selectedPage} onSelectPage={setSelectedPage} />
        <MainContent selection={selectedPage} />
        <RightSidebar />
      </div>

      <Footer />
    </div>
  )
}

export default App
