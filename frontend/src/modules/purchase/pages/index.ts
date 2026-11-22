import type { ComponentType } from 'react'
import {
  VendorPage,
  AdvanceRequisitionPage,
  QuotationComparisonPage,
  PurchaseOrderPage,
} from './PurchasePages'

export const purchasePages: Record<string, ComponentType> = {
  'vendor': VendorPage,
  'advance-requisition': AdvanceRequisitionPage,
  'quotation-comparison': QuotationComparisonPage,
  'purchase-order': PurchaseOrderPage
}
