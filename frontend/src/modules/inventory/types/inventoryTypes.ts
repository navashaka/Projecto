export type InventoryResourceKey =
  | 'unit-of-measures'
  | 'stock-groups'
  | 'stock-items'
  | 'indents'
  | 'gate-entries'
  | 'material-receipt-notes'
  | 'delivery-challans'
  | 'delivery-challan-inwards'
  | 'goods-issues'
  | 'goods-issue-sales'

export type InventoryFieldKind =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'datetime-local'
  | 'time'
  | 'boolean'
  | 'select'

export type InventoryFieldValue =
  | string
  | number
  | boolean
  | null
  | undefined

export interface InventoryItemDraft {
  [field: string]: InventoryFieldValue
}

export interface InventoryFormValues {
  items?: InventoryItemDraft[]
  [field: string]:
    | InventoryFieldValue
    | InventoryItemDraft[]
}

export interface InventoryRecord {
  [field: string]: unknown
}

export interface InventoryFieldOption {
  value: number | string
  label: string
}

export interface InventoryFieldDefinition {
  name: string
  label: string
  kind: InventoryFieldKind
  required?: boolean
  maxLength?: number
  step?: number
  defaultValue?: InventoryFieldValue
  optionsEndpoint?: string
  optionValue?: string
  optionLabelFields?: string[]
  choices?: Array<{ value: string; label: string }>
}

export interface InventoryItemsDefinition {
  endpoint: string
  parentField: string
  fields: InventoryFieldDefinition[]
}

export interface InventoryResourceDefinition {
  key: InventoryResourceKey
  label: string
  endpoint: string
  fields: InventoryFieldDefinition[]
  displayColumns: Array<{ field: string; label: string }>
  items?: InventoryItemsDefinition
}
