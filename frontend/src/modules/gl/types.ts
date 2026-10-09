export type GLFieldKind =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'boolean'
  | 'select'

export interface GLFieldDefinition {
  name: string
  label: string
  kind: GLFieldKind
  required?: boolean
  step?: number
  optionEndpoint?: string
  optionLabelFields?: string[]
}

export interface GLResourceDefinition {
  key: string
  label: string
  endpoint: string
  fields: GLFieldDefinition[]
  columns: Array<{ field: string; label: string }>
}

export interface GLRecord {
  [field: string]: unknown
}
