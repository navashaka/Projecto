import type { ComponentType } from 'react'
import type { ModuleId, ModulePageSelection } from '../../modules/types'
import { arPages } from '../../modules/ar/pages'
import { glPages } from '../../modules/gl/pages'
import { hrPages } from '../../modules/hr/pages'
import { inventoryPages } from '../../modules/inventory/pages'
import { purchasePages } from '../../modules/purchase/pages'
import { bankPages } from '../../modules/bank/pages'
import { productionPages } from '../../modules/production'
import ProductionPage from '../../modules/production/ProductionPages'
import { GLAccountPage, TaxApplicabilityPage } from '../../modules/gl/pages/GLPages'
import ProfilePage from '../../modules/profile/ProfilePages'
import TempUploadDownload from '../../modules/shared/TempUploadDownload'

type MainContentProps = {
  selection: ModulePageSelection | null
  onSelectPage: (selection: ModulePageSelection) => void
}

const MainContent = ({ selection, onSelectPage }: MainContentProps) => {
  const pageRegistry: Record<ModuleId, Record<string, ComponentType>> = {
    hr: hrPages,
    gl: glPages,
    ar: arPages,
    inventory: inventoryPages,
    purchase: purchasePages,
    bank: bankPages,
    production: productionPages,
    profile: { profile: ProfilePage },
  }
  const SelectedPage = selection
    ? pageRegistry[selection.module]?.[selection.page]
    : undefined
  const productionForm = selection?.module === 'production'
    ? selection.page === 'production-output-product'
      ? 'output-product'
      : selection.page === 'production-entry'
        ? 'production-entry'
        : undefined
    : undefined

  return (
    <main className="card border-0 shadow-sm h-100">
      <div className="card-body p-3">
        {selection?.page === 'template-upload-download' ? (
          <TempUploadDownload key={selection.module} module={selection.module} />
        ) : productionForm ? (
          <ProductionPage activeForm={productionForm} />
        ) : selection?.module === 'gl' && selection.page === 'gl-account' ? (
          <GLAccountPage onSelectPage={onSelectPage} />
        ) : selection?.module === 'gl' && selection.page === 'tax-applicability' ? (
          <TaxApplicabilityPage onSelectPage={onSelectPage} />
        ) : SelectedPage ? <SelectedPage /> : (
          <div className="border border-dashed rounded bg-light d-flex align-items-center justify-content-center text-muted" style={{ minHeight: '38vh' }}>
            Select a submenu item to open its module page
          </div>
        )}
      </div>
    </main>
  )
}

export default MainContent
