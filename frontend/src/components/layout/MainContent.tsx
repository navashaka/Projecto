import type { ComponentType } from 'react'
import type { ModuleId, ModulePageSelection } from '../../modules/types'
import { arPages } from '../../modules/ar/pages'
import { glPages } from '../../modules/gl/pages'
import { hrPages } from '../../modules/hr/pages'
import { inventoryPages } from '../../modules/inventory/pages'

type MainContentProps = {
  selection: ModulePageSelection | null
}

const MainContent = ({ selection }: MainContentProps) => {
  const pageRegistry: Record<ModuleId, Record<string, ComponentType>> = {
    hr: hrPages,
    gl: glPages,
    ar: arPages,
    inventory: inventoryPages
  }
  const SelectedPage = selection ? pageRegistry[selection.module][selection.page] : undefined

  return (
    <main className="card border-0 shadow-sm h-100">
      <div className="card-body p-3">
        {SelectedPage ? <SelectedPage /> : (
          <div className="border border-dashed rounded bg-light d-flex align-items-center justify-content-center text-muted" style={{ minHeight: '38vh' }}>
            Select a submenu item to open its module page
          </div>
        )}
      </div>
    </main>
  )
}

export default MainContent
