import { useState } from 'react'
import './App.css'
import Header from './components/layout/Header'
import LeftSidebar from './components/layout/LeftSidebar'
import MainContent from './components/layout/MainContent'
import RightSidebar from './components/layout/RightSidebar'
import Footer from './components/layout/Footer'
import type { ModulePageSelection } from './modules/types'

function App() {
  const [selectedPage, setSelectedPage] =
    useState<ModulePageSelection | null>(null)

  return (
    <div className="app-shell">
      <Header />

      <div className="app-body">
        <LeftSidebar
          selection={selectedPage}
          onSelectPage={setSelectedPage}
        />
        <MainContent selection={selectedPage} />
        <RightSidebar />
      </div>

      <Footer />
    </div>
  )
}

export default App