import ModuleDataPage from '../../shared/ModuleDataPage'

export const VendorPage = () => (
  <ModuleDataPage module="purchase" title="Vendor" fields={[
    { name: 'vendorName', label: 'Vendor name' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phone', label: 'Phone' },
    { name: 'streetNumber', label: 'Street Number' },
    { name: 'streetName', label: 'Street Name' },
    { name: 'city', label: 'City' },
    { name: 'state', label: 'State' },
    { name: 'country', label: 'Country' },
    { name: 'zipcode', label: 'Zip Code' },
    { name: 'pan', label: 'PAN' },
    { name: 'gstin', label: 'GSTIN' },
    { name: 'bankDetails', label: 'Bank Details', section: 'Bank Details' },
    { name: 'bankName', label: 'Bank Name' },
    { name: 'accountNumber', label: 'Account Number' },
    { name: 'ifscCode', label: 'IFSC Code' },
    { name: 'msmeDetails', label: 'MSME Details', section: 'MSME Details' },
    { name: 'msmeStatus', label: 'MSME Status', type: 'select', options: ['Registered', 'Unregistered'] },
    { name: 'msmeNumber', label: 'MSME Number' },
    { name: 'activity', label: 'Activity', type: 'select', options: ['Manufacturing', 'Service', 'Trading'] },
  ]} />
)

export const AdvanceRequisitionPage = () => (
  <ModuleDataPage module="purchase" title="Advance Requisition" fields={[
    { name: 'vendorname', label: 'Name' },
    { name: 'streetNumber', label: 'Street Number' },
    { name: 'streetName', label: 'Street Name' },
    { name: 'city', label: 'City' },
    { name: 'state', label: 'State' },
    { name: 'country', label: 'Country' },
    { name: 'zipcode', label: 'Zip Code' },
    { name: 'bankDetails', label: 'Bank Details', section: 'Bank Details' },
    { name: 'bankName', label: 'Bank Name' },
    { name: 'accountNumber', label: 'Account Number' },
    { name: 'ifscCode', label: 'IFSC Code' },
    { name: 'purchaseOrderNumber', label: 'Purchase Order Number' },
    { name: 'purchaseOrderDate', label: 'Purchase Order Date', type: 'date' },
    { name: 'PurchaseOrderValueBeforeGST', label: 'Purchase Order Value Before GST', type: 'number' },
    { name: 'purchaseOrderValueAfterGST', label: 'Purchase Order Value After GST', type: 'number' },
    { name: 'advanceRequestedAmount', label: 'Advance Requested Amount', type: 'number' },
    { name: 'createdBy', label: 'Created by' },
    { name: 'checkedBy', label: 'Checked by' },
    { name: 'approvedBy', label: 'Approved by' }
  ]} />
)

export const QuotationComparisonPage = () => (
  <ModuleDataPage module="purchase" title="Quotation Comparison" fields={[
    { name: 'vendorname', label: 'Vendor Name' },
    { name: 'streetNumber', label: 'Street Number' },
    { name: 'streetName', label: 'Street Name' },
    { name: 'city', label: 'City' },
    { name: 'state', label: 'State' },
    { name: 'country', label: 'Country' },
    { name: 'zipcode', label: 'Zip Code' },
    { name: 'quotationNumber', label: 'Quotation Number' },
    { name: 'quotationDate', label: 'Quotation date', type: 'date' },
    { name: 'item', label: 'Item' },
    { name: 'description', label: 'Description' },
    { name: 'quantity', label: 'Quantity', type: 'number' },
    { name: 'uom', label: 'UOM' },
    { name: 'rate', label: 'Rate', type: 'number' },
    { name: 'amount', label: 'Amount', type: 'number' },
    { name: 'totalAmount', label: 'Grand Total', type: 'number' },
    { name: 'deliveryterms', label: 'Delivery Terms' },
    { name: 'paymentterms', label: 'Payment Terms' },
    { name: 'additionalTerms&Conditions', label: 'Additional Terms & Conditions' },
  ]} />
)

export const PurchaseOrderPage = () => (
  <ModuleDataPage module="purchase" title="Purchase Order" fields={[
    { name: 'orderNumber', label: 'Order number' },
    { name: 'orderDate', label: 'Order date', type: 'date' },
    { name: 'indentNumber', label: 'Indent number' },
    { name: 'indentDate', label: 'Indent date', type: 'date' },
    { name: 'quotationNumber', label: 'Quotation number' },
    { name: 'quotationDate', label: 'Quotation date', type: 'date' },
    { name: 'vendorname', label: 'Vendor Name' },
    { name: 'streetNumber', label: 'Street Number' },
    { name: 'streetName', label: 'Street Name' },
    { name: 'city', label: 'City' },
    { name: 'state', label: 'State' },
    { name: 'country', label: 'Country' },
    { name: 'zipcode', label: 'Zip Code' },
    { name: 'bankDetails', label: 'Bank Details', section: 'Bank Details' },
    { name: 'bankName', label: 'Bank Name' },
    { name: 'accountNumber', label: 'Account Number' },
    { name: 'ifscCode', label: 'IFSC Code' },
    { name: 'item', label: 'Item' },
    { name: 'description', label: 'Description' },
    { name: 'quantity', label: 'Quantity', type: 'number' },
    { name: 'uom', label: 'UOM' },
    { name: 'rate', label: 'Rate', type: 'number' },
    { name: 'amount', label: 'Amount', type: 'number' },
    { name: 'totalAmount', label: 'Grand Total', type: 'number' },
    { name: 'Deliveryterms', label: 'Delivery Terms' },
    { name: 'Paymentterms', label: 'Payment Terms' },
    { name: 'defaultTerms&Conditions', label: 'Default Terms & Conditions' },
    { name: 'additionalTerms&Conditions', label: 'Additional Terms & Conditions' },
    { name: 'createdBy', label: 'Created by' },
    { name: 'checkedBy', label: 'Checked by' },
    { name: 'approvedBy', label: 'Approved by' }
  ]} />
)
