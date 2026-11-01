import type { ComponentType } from 'react'
import {
  UnitOfMeasurementPage,
  GateEntryPage,
  StockGroupPage,
  StockItemPage,
  IndentPage,
  MaterialReceiptNotePage,
  DeliveryChallanInwardPage,
  DeliveryChallanOutwardPage,
  GoodsIssueForConsumptionPage,
  GoodsIssueForSalePage,
} from './InventoryPages'

export const inventoryPages: Record<string, ComponentType> = {
  'unit-of-measurement': UnitOfMeasurementPage,
  'gate-entry': GateEntryPage,
  'stock-group': StockGroupPage,
  'stock-item': StockItemPage,
  'indent': IndentPage,
  'material-receipt-note': MaterialReceiptNotePage,
  'delivery-challan-inward': DeliveryChallanInwardPage,
  'delivery-challan-outward': DeliveryChallanOutwardPage,
  'goods-issue-for-consumption': GoodsIssueForConsumptionPage,
  'goods-issue-for-sale': GoodsIssueForSalePage
}
