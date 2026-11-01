import ModuleDataPage from '../../shared/ModuleDataPage'

export const UnitOfMeasurementPage = () => (
  <ModuleDataPage module="inventory" title="Unit of Measurement" fields={[
    { name: 'symbol', label: 'Symbol' },
    { name: 'formalName', label: 'Formal Name' },
    { name: 'numberOfDecimals', label: 'Number of Decimals', type: 'number' }
  ]} />
)

export const GateEntryPage = () => (
  <ModuleDataPage module="inventory" title="Gate Entry" fields={[
    { name: 'gateNumber', label: 'Gate number' },
    { name: 'vehicleNumber', label: 'Vehicle number' },
    { name: 'TransporterName', label: 'Transporter Name' },
    { name: 'vehicleNumber', label: 'Vehicle number' },
    { name: 'entryTime', label: 'Entry time', type: 'time' },
    { name: 'date', label: 'Date', type: 'date' },
    { name: 'vendor name', label: 'Vendor name' },
    { name: 'vendorInvoiceDate', label: 'Vendor Invoice Date', type: 'date' },
    { name: 'vendorInvoiceNumber', label: 'Vendor Invoice Number' },
    { name: 'streetNumber', label: 'Street Number' },
    { name: 'streetName', label: 'Street Name' },
    { name: 'city', label: 'City' },
    { name: 'state', label: 'State' },
    { name: 'country', label: 'Country' },
    { name: 'zipCode', label: 'Zip Code' },
    { name: 'items', label: 'Items' },
    { name: 'totalAmount', label: 'Total Amount', type: 'number' },
    { name: 'creation', label: 'Creation', type: 'date' },
    { name: 'createdBy', label: 'Created By' },
    { name: 'approvedBy', label: 'Approved By' }
  ]} />
)

export const StockGroupPage = () => (
  <ModuleDataPage module="inventory" title="Stock Group" fields={[
    { name: 'nameOfGroup', label: 'Name' },
    { name: 'underGroup', label: 'Under Group', type: 'select', options: ['Primary Stock Group', 'Raw Material Group', 'Finished Product Group', 'Consumables Group', 'Packaging Material Group', 'Trading Items Group', 'Tools&Spares Group'] }
  ]} />
)

export const StockItemPage = () => (
  <ModuleDataPage module="inventory" title="Stock Item" fields={[
    { name: 'nameOfItem', label: 'Name' },
    { name: 'unitOfMeasurement', label: 'Unit of Measurement' },
    { name: 'underGroup', label: 'Under Group', type: 'select', options: ['Primary Stock Group', 'Raw Material Group', 'Finished Product Group', 'Consumables Group', 'Packaging Material Group', 'Trading Items Group', 'Tools&Spares Group'] },
    { name: 'reorderLevel', label: 'Reorder Level', type: 'number' }
  ]} />
)

export const IndentPage = () => (
  <ModuleDataPage module="inventory" title="Indent" fields={[
    { name: 'indentNumber', label: 'Indent number' },
    { name: 'department', label: 'Department' },
    { name: 'item', label: 'Item' },
    { name: 'quantity', label: 'Quantity', type: 'number' },
    { name: 'indentDate', label: 'Indent date', type: 'date' },
    { name: 'itemCount', label: 'Item count', type: 'number' },
    { name: 'estimatedTotal', label: 'Estimated total', type: 'number' },
    { name: 'createdBy', label: 'Created by' },
    { name: 'approvedBy', label: 'Approved by' },
  ]} />
)

export const MaterialReceiptNotePage = () => (
  <ModuleDataPage module="inventory" title="Material Receipt Note" fields={[
    { name: 'gateEntryNumber', label: 'Gate entry number' },
    { name: 'entryDate', label: 'Entry date', type: 'date' },
    { name: 'entryTime', label: 'Entry time', type: 'time' },
    { name: 'receiptNumber', label: 'Receipt number' },
    { name: 'receiptDate', label: 'Receipt date', type: 'date' },
    { name: 'vendorName', label: 'Vendor name' },
    { name: 'vendorInvoiceNumber', label: 'Vendor Invoice Number' },
    { name: 'vendorInvoiceDate', label: 'Vendor Invoice Date', type: 'date' },
    { name: 'streetNumber', label: 'Street Number' },
    { name: 'streetName', label: 'Street Name' },
    { name: 'city', label: 'City' },
    { name: 'state', label: 'State' },
    { name: 'country', label: 'Country' },
    { name: 'zipCode', label: 'Zip Code' },
    { name: 'ewayBillNumber', label: 'E-way Bill Number' },
    { name: 'ewayBillDate', label: 'E-way Bill Date', type: 'date' },
    { name: 'transporterName', label: 'Transporter Name' },
    { name: 'vehicleNumber', label: 'Vehicle Number' },
    { name: 'item', label: 'Item' },
    { name: 'quantity', label: 'Quantity', type: 'number' },
    { name: 'rate', label: 'Rate', type: 'number' },
    { name: 'amount', label: 'Amount', type: 'number' },
    { name: 'totalAmount', label: 'Total Amount', type: 'number' },
    { name: 'createdBy', label: 'Created by' },
    { name: 'checkedBy', label: 'Checked by' },
    { name: 'approvedBy', label: 'Approved by' }
  ]} />
)

export const DeliveryChallanInwardPage = () => (
  <ModuleDataPage module="inventory" title="Delivery Challan (Inward)" fields={[
    { name: 'challanNumber', label: 'Delivery challan number' },
    { name: 'challanDate', label: 'Delivery date', type: 'date' },
    { name: 'purpose', label: 'Purpose', type: 'select', options: ['For Sale', 'For Job Work', 'For Sample', 'For Delivery', 'For Repair & Maintenance'] },
    { name: 'streetNumber', label: 'Street Number' },
    { name: 'streetName', label: 'Street Name' },
    { name: 'city', label: 'City' },
    { name: 'state', label: 'State' },
    { name: 'country', label: 'Country' },
    { name: 'zipCode', label: 'Zip Code' },
    { name: 'workOrder', label: 'Work Order', type: 'select', options: ['Agreement', 'Contract'] },
    { name: 'date', label: 'Date', type: 'date' },
    { name: 'itemCount', label: 'Item count', type: 'number' },
    { name: 'item', label: 'Item' },
    { name: 'quantity', label: 'Quantity', type: 'number' },
    { name: 'rate', label: 'Rate', type: 'number' },
    { name: 'amount', label: 'Amount', type: 'number' },
    { name: 'gst', label: 'GST', type: 'number' },
    { name: 'totalAmount', label: 'Grand Total', type: 'number' },
    { name: 'TransporterName', label: 'Transporter Name' },
    { name: 'vehicleNumber', label: 'Vehicle Number' },
    { name: 'ewayBill', label: 'E-way Bill', type: 'select', options: ['Required', 'Not Required'] },
    { name: 'ewayBillNumber', label: 'E-way Bill Number' },
    { name: 'ewayBillDate', label: 'E-way Bill Date', type: 'date' },
    { name: 'createdBy', label: 'Created by' },
    { name: 'checkedBy', label: 'Checked by' },
    { name: 'approvedBy', label: 'Approved by' }
  ]} />
)

export const DeliveryChallanOutwardPage = () => (
  <ModuleDataPage module="inventory" title="Delivery Challan (Outward)" fields={[
    { name: 'challanNumber', label: 'Delivery challan number' },
    { name: 'challanDate', label: 'Delivery date', type: 'date' },
    { name: 'purpose', label: 'Purpose', type: 'select', options: ['For Sale', 'For Job Work', 'For Sample', 'For Delivery', 'For Repair & Maintenance'] },
    { name: 'itemCount', label: 'Item count', type: 'number' },
    { name: 'item', label: 'Item' },
    { name: 'quantity', label: 'Quantity', type: 'number' },
    { name: 'rate', label: 'Rate', type: 'number' },
    { name: 'amount', label: 'Amount', type: 'number' },
    { name: 'gst', label: 'GST', type: 'number' },
    { name: 'totalAmount', label: 'Grand Total', type: 'number' },
    { name: 'TransporterName', label: 'Transporter Name' },
    { name: 'vehicleNumber', label: 'Vehicle Number' },
    { name: 'ewayBill', label: 'E-way Bill', type: 'select', options: ['Required', 'Not Required'] },
    { name: 'ewayBillNumber', label: 'E-way Bill Number' },
    { name: 'ewayBillDate', label: 'E-way Bill Date', type: 'date' },
    { name: 'createdBy', label: 'Created by' },
    { name: 'checkedBy', label: 'Checked by' },
    { name: 'approvedBy', label: 'Approved by' }
  ]} />
)
export const GoodsIssueForConsumptionPage = () => (
  <ModuleDataPage module="inventory" title="Goods Issue (For Consumption)" fields={[
    { name: 'issueNumber', label: 'Issue number' },
    { name: 'department', label: 'Department' },
    { name: 'issueDate', label: 'Issue date', type: 'date' },
    { name: 'itemCount', label: 'Item count', type: 'number' },
    { name: 'item', label: 'Item' },
    { name: 'quantity', label: 'Quantity', type: 'number' },
    { name: 'rate', label: 'Rate', type: 'number' },
    { name: 'amount', label: 'Amount', type: 'number' },
    { name: 'gst', label: 'GST', type: 'number' },
    { name: 'totalAmount', label: 'Grand Total', type: 'number' }
  ]} />
)
export const GoodsIssueForSalePage = () => (
  <ModuleDataPage module="inventory" title="Goods Issue (For Sale)" fields={[
    { name: 'saleNumber', label: 'Sale number' },
    { name: 'saleOrderDate', label: 'Sale Order Date', type: 'date' },
    { name: 'department', label: 'Department' },
    { name: 'itemCount', label: 'Item count', type: 'number' },
    { name: 'item', label: 'Item' },
    { name: 'quantity', label: 'Quantity', type: 'number' },
    { name: 'totalAmount', label: 'Grand Total', type: 'number' },
    { name: 'createdBy', label: 'Created by' },
    { name: 'checkedBy', label: 'Checked by' },
    { name: 'approvedBy', label: 'Approved by' }
  ]} />
)