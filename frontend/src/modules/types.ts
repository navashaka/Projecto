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
  required?: boolean
  uppercase?: boolean
}
