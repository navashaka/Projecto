import ModuleDataPage from '../../shared/ModuleDataPage'

export const CustomerPage = () => (
  <ModuleDataPage module="ar" title="Customer" fields={[
    { name: 'customerName', label: 'Customer name' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phone', label: 'Phone' },
    { name: 'billingAddress', label: 'Billing address' }
  ]} />
)

export const InvoicePage = () => (
  <ModuleDataPage module="ar" title="Invoice" fields={[
    { name: 'invoiceNumber', label: 'Invoice number' },
    { name: 'customer', label: 'Customer' },
    { name: 'invoiceDate', label: 'Invoice date', type: 'date' },
    { name: 'dueDate', label: 'Due date', type: 'date' },
    { name: 'amountDue', label: 'Amount due', type: 'number' }
  ]} />
)

export const ProformaInvoicePage = () => (
  <ModuleDataPage module="ar" title="Proforma Invoice" fields={[
    { name: 'proformaNumber', label: 'Proforma number' },
    { name: 'customer', label: 'Customer' },
    { name: 'issueDate', label: 'Issue date', type: 'date' },
    { name: 'validUntil', label: 'Valid until', type: 'date' },
    { name: 'estimatedTotal', label: 'Estimated total', type: 'number' }
  ]} />
)

export const QuotationPage = () => (
  <ModuleDataPage module="ar" title="Quotation" fields={[
    { name: 'quotationNumber', label: 'Quotation number' },
    { name: 'customer', label: 'Customer' },
    { name: 'quotationDate', label: 'Quotation date', type: 'date' },
    { name: 'validUntil', label: 'Valid until', type: 'date' },
    { name: 'quotedTotal', label: 'Quoted total', type: 'number' }
  ]} />
)

export const TaxInvoicePage = () => (
  <ModuleDataPage module="ar" title="Tax Invoice" fields={[
    { name: 'invoiceNumber', label: 'Tax invoice number' },
    { name: 'customer', label: 'Customer' },
    { name: 'invoiceDate', label: 'Invoice date', type: 'date' },
    { name: 'taxAmount', label: 'Tax amount', type: 'number' },
    { name: 'totalDue', label: 'Total due', type: 'number' }
  ]} />
)
