import type { ReactNode } from 'react'
import type { ModuleId } from '../types'

const moduleLabels: Record<ModuleId, string> = {
  hr: 'Human Resources',
  gl: 'General Ledger',
  ar: 'Accounts Receivable',
  inventory: 'Inventory'
}

type ModulePageFrameProps = {
  module: ModuleId
  page: string
  children?: ReactNode
}

const ModulePageFrame = ({ module, page, children }: ModulePageFrameProps) => (
  <section aria-labelledby="module-page-title">
    <p className="text-uppercase text-primary small fw-semibold mb-1">
      {moduleLabels[module]}
    </p>
    <h1 id="module-page-title" className="h3 mb-4">
      {page}
    </h1>
    {children ?? (
      <div className="border rounded p-4 bg-light">
        <p className="text-muted mb-0">
          The {page} page is selected. Its module content can be added here.
        </p>
      </div>
    )}
  </section>
)

export default ModulePageFrame
