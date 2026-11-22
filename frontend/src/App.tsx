import { useState } from 'react'
import './App.css'
import Header from './components/layout/Header'
import LeftSidebar from './components/layout/LeftSidebar'
import MainContent from './components/layout/MainContent'
import RightSidebar from './components/layout/RightSidebar'
import Footer from './components/layout/Footer'
import type { ModuleId, ModulePageSelection } from './modules/types'

function App() {
  const [selectedPage, setSelectedPage] =
    useState<ModulePageSelection | null>(null)

  const openTemplateTools = (module: ModuleId) => {
    setSelectedPage({ module, page: 'template-upload-download' })
  }

  return (
    <div className="app-shell">
      <Header onSelectTemplateModule={openTemplateTools} />

      <div className="app-body">
        <LeftSidebar
          selection={selectedPage}
          onSelectPage={setSelectedPage}
        />
        <MainContent
          selection={selectedPage}
          onSelectPage={setSelectedPage}
        />
        <RightSidebar />
      </div>

      <Footer />
    </div>
  );
}

export default App
