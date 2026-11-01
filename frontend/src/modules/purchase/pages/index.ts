import type { ComponentType } from 'react'
import {
  VendorCreationAlterationPage,
  AdvanceRequisitionPage,
  QuotationComparisonPage,
  PurchaseOrderPage,
} from './PurchasePages'

export const purchasePages: Record<string, ComponentType> = {
  'vendor-creation/alteration': VendorCreationAlterationPage,
  'advance-requisition': AdvanceRequisitionPage,
  'quotation-comparison': QuotationComparisonPage,
  'purchase-order': PurchaseOrderPage
}
