export type ModuleId = 'hr' | 'gl' | 'ar' | 'inventory' | 'purchase' | 'bank' | 'profile' | 'production'

export type ModulePageSelection = {
  module: ModuleId
  page: string
}

export type ModulePageField = {
  name: string
  label: string
  section?: string
  type?: 'text' | 'date' | 'email' | 'number' | 'month' | 'time' | 'tel' | 'select' | 'textarea' | 'file' 
  options?: string[]
  lookup?: string
  actionOption?: {
    label: string
    onSelect: () => void
  }
  required?: boolean
  uppercase?: boolean
  visibleWhen?: Array<{
    field: string
    values: string[]
    lookupLabel?: boolean
  }>
}
