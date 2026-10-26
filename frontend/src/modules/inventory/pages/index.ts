import type { ComponentType } from 'react'
import {
  CustomerPage,
  InvoicePage,
  ProformaInvoicePage,
  QuotationPage,
  TaxInvoicePage
} from './InventoryPages'

export const inventoryPages: Record<string, ComponentType> = {
  customer: CustomerPage,
  invoice: InvoicePage,
  'proforma-invoice': ProformaInvoicePage,
  quotation: QuotationPage,
  'tax-invoice': TaxInvoicePage
}
