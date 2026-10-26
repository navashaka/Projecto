import ModuleDataPage from '../../shared/ModuleDataPage'

export const CustomerPage = () => (
  <ModuleDataPage module="gl" title="Customer" fields={[
    { name: 'customerName', label: 'Customer name' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phone', label: 'Phone' },
    { name: 'taxId', label: 'Tax ID' }
  ]} />
)

export const InvoicePage = () => (
  <ModuleDataPage module="gl" title="Invoice" fields={[
    { name: 'invoiceNumber', label: 'Invoice number' },
    { name: 'customer', label: 'Customer' },
    { name: 'invoiceDate', label: 'Invoice date', type: 'date' },
    { name: 'dueDate', label: 'Due date', type: 'date' },
    { name: 'total', label: 'Total amount', type: 'number' }
  ]} />
)

export const ProformaInvoicePage = () => (
  <ModuleDataPage module="gl" title="Proforma Invoice" fields={[
    { name: 'proformaNumber', label: 'Proforma number' },
    { name: 'customer', label: 'Customer' },
    { name: 'issueDate', label: 'Issue date', type: 'date' },
    { name: 'validUntil', label: 'Valid until', type: 'date' },
    { name: 'total', label: 'Total amount', type: 'number' }
  ]} />
)

export const QuotationPage = () => (
  <ModuleDataPage module="gl" title="Quotation" fields={[
    { name: 'quotationNumber', label: 'Quotation number' },
    { name: 'customer', label: 'Customer' },
    { name: 'quotationDate', label: 'Quotation date', type: 'date' },
    { name: 'validUntil', label: 'Valid until', type: 'date' },
    { name: 'total', label: 'Total amount', type: 'number' }
  ]} />
)

export const TaxInvoicePage = () => (
  <ModuleDataPage module="gl" title="Tax Invoice" fields={[
    { name: 'invoiceNumber', label: 'Tax invoice number' },
    { name: 'customer', label: 'Customer' },
    { name: 'invoiceDate', label: 'Invoice date', type: 'date' },
    { name: 'taxAmount', label: 'Tax amount', type: 'number' },
    { name: 'total', label: 'Total amount', type: 'number' }
  ]} />
)
