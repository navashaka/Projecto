import ModuleDataPage from '../../shared/ModuleDataPage'

export const CustomerPage = () => (
  <ModuleDataPage module="inventory" title="Customer" fields={[
    { name: 'customerName', label: 'Customer name' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phone', label: 'Phone' },
    { name: 'accountReference', label: 'Account reference' }
  ]} />
)

export const InvoicePage = () => (
  <ModuleDataPage module="inventory" title="Invoice" fields={[
    { name: 'invoiceNumber', label: 'Invoice number' },
    { name: 'customer', label: 'Customer' },
    { name: 'invoiceDate', label: 'Invoice date', type: 'date' },
    { name: 'itemCount', label: 'Item count', type: 'number' },
    { name: 'total', label: 'Total amount', type: 'number' }
  ]} />
)

export const ProformaInvoicePage = () => (
  <ModuleDataPage module="inventory" title="Proforma Invoice" fields={[
    { name: 'proformaNumber', label: 'Proforma number' },
    { name: 'customer', label: 'Customer' },
    { name: 'issueDate', label: 'Issue date', type: 'date' },
    { name: 'itemCount', label: 'Item count', type: 'number' },
    { name: 'estimatedTotal', label: 'Estimated total', type: 'number' }
  ]} />
)

export const QuotationPage = () => (
  <ModuleDataPage module="inventory" title="Quotation" fields={[
    { name: 'quotationNumber', label: 'Quotation number' },
    { name: 'customer', label: 'Customer' },
    { name: 'quotationDate', label: 'Quotation date', type: 'date' },
    { name: 'itemCount', label: 'Item count', type: 'number' },
    { name: 'quotedTotal', label: 'Quoted total', type: 'number' }
  ]} />
)

export const TaxInvoicePage = () => (
  <ModuleDataPage module="inventory" title="Tax Invoice" fields={[
    { name: 'invoiceNumber', label: 'Tax invoice number' },
    { name: 'customer', label: 'Customer' },
    { name: 'invoiceDate', label: 'Invoice date', type: 'date' },
    { name: 'taxAmount', label: 'Tax amount', type: 'number' },
    { name: 'total', label: 'Total amount', type: 'number' }
  ]} />
)
