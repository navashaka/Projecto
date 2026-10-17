export type ARValue = string | number | boolean | null | undefined
export type ARRecord = Record<string, unknown> & { id?: number }

export type ARFieldKind =
  | 'text'
  | 'number'
  | 'date'
  | 'datetime-local'
  | 'textarea'
  | 'boolean'
  | 'select'
  | 'customer'
  | 'quotation'
  | 'proforma-invoice'

export interface ARFieldDefinition {
  name: string
  kind: ARFieldKind
  required?: boolean
  step?: number
  readOnly?: boolean
  options?: string[]
}

export interface ARDocumentDefinition {
  title: string
  endpoint: string
  fields: ARFieldDefinition[]
  itemFields: ARFieldDefinition[]
  itemName: string
  itemForeignKey: string
  itemKind: 'quotation' | 'taxable'
}

export interface ARBankAccount {
  account_no: string
  ifsc: string
}
