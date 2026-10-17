import type { ARDocumentDefinition, ARFieldDefinition } from '../types/arTypes'

const textFields = (names: string, required: string[] = []): ARFieldDefinition[] =>
  names.split(' ').filter(Boolean).map((name) => ({
    name,
    kind: 'text',
    required: required.includes(name),
  }))

const numberFields = (
  names: string,
  step = 0.01,
): ARFieldDefinition[] =>
  names.split(' ').filter(Boolean).map((name) => ({ name, kind: 'number', step }))

const dateFields = (names: string): ARFieldDefinition[] =>
  names.split(' ').filter(Boolean).map((name) => ({ name, kind: 'date' }))

const commonItemFields: ARFieldDefinition[] = [
  { name: 'sl_no', kind: 'number', step: 1, required: true },
  { name: 'description', kind: 'textarea', required: true },
  { name: 'hsn', kind: 'text' },
  { name: 'quantity', kind: 'number', step: 0.001 },
  { name: 'rate', kind: 'number' },
  { name: 'uom', kind: 'text' },
  { name: 'value', kind: 'number', readOnly: true },
  { name: 'gst_rate', kind: 'number' },
  { name: 'tax', kind: 'number', readOnly: true },
  { name: 'total_amount', kind: 'number', readOnly: true },
]

const paymentTermsOptions = [
  'Created',
  'Approved',
  'Checked',
]

export const arCustomerFields: ARFieldDefinition[] = [
  ...textFields('customer_name', ['customer_name']),
  ...textFields(
    'bill_to_address address_1 address_2 address_3 city pin state country region industry',
  ),
  ...textFields('pan', ['pan']),
  ...textFields(
    'gstn email_id contact_no contact_person_name ship_to_address ship_to_address_1 ship_to_address_2 ship_to_address_3 msme_status msme_no activity',
  ),
]
arCustomerFields.find((field) => field.name === 'bill_to_address')!.kind = 'textarea'
arCustomerFields.find((field) => field.name === 'ship_to_address')!.kind = 'textarea'

export const arDocuments: Record<string, ARDocumentDefinition> = {
  quotations: {
    title: 'Quotation',
    endpoint: 'quotations',
    itemName: 'Quotation items',
    itemForeignKey: 'quotation_id',
    itemKind: 'quotation',
    fields: [
      { name: 'quotation_no', kind: 'text' },
      { name: 'quotation_date', kind: 'date', required: true },
      { name: 'customer_id', kind: 'customer', required: true },
      ...textFields('vendor_name'),
      { name: 'address', kind: 'textarea' },
      { name: 'address_of_delivery', kind: 'textarea' },
      ...numberFields('total gst grand_total'),
      { name: 'terms_of_delivery', kind: 'textarea' },
      {
        name: 'terms_of_payment',
        kind: 'select',
        options: paymentTermsOptions,
      },
    ],
    itemFields: [
      { name: 'item_no', kind: 'number', step: 1, required: true },
      { name: 'product_item_description', kind: 'textarea', required: true },
      { name: 'quantity', kind: 'number', step: 0.001 },
      { name: 'rate', kind: 'number' },
      { name: 'amount', kind: 'number', readOnly: true },
    ],
  },
  'proforma-invoices': {
    title: 'Proforma Invoice',
    endpoint: 'proforma-invoices',
    itemName: 'Proforma invoice items',
    itemForeignKey: 'proforma_invoice_id',
    itemKind: 'taxable',
    fields: [
      ...textFields('proforma_invoice_no'),
      { name: 'proforma_invoice_date', kind: 'date', required: true },
      {
        name: 'proforma_invoice_type',
        kind: 'select',
        required: true,
        options: ['Goods', 'Service', 'Export'],
      },
      { name: 'dispatch_type', kind: 'select' },
      ...numberFields('oc_id', 1),
      { name: 'quotation_id', kind: 'quotation' },
      ...textFields('order_by asm order_approved_by'),
      ...textFields('consignee_customer_name consignee_pan consignee_gstn'),
      ...textFields('consignee_address_1 consignee_address_2 consignee_address_3'),
      { name: 'buyer_customer_id', kind: 'customer' },
      ...textFields('buyer_customer_name buyer_pan buyer_gstn'),
      ...textFields('buyer_address_1 buyer_address_2 buyer_address_3'),
      ...textFields('customer_purchase_order_no'),
      ...dateFields('po_date'),
      ...numberFields('total gst grand_total'),
      { name: 'terms_of_delivery', kind: 'textarea' },
      {
        name: 'terms_of_payment',
        kind: 'select',
        options: ['Creation', 'Checked', 'Approved'],
      },
      ...textFields('created_by checked_by approved_by'),
    ],
    itemFields: [
      { name: 'sl_no', kind: 'number', step: 1, required: true },
      { name: 'description', kind: 'textarea', required: true },
      { name: 'quantity', kind: 'number', step: 0.001 },
      { name: 'rate', kind: 'number' },
      { name: 'gst_rate', kind: 'number' },
      { name: 'value', kind: 'number', readOnly: true },
      { name: 'tax', kind: 'number', readOnly: true },
      { name: 'total_amount', kind: 'number', readOnly: true },
      { name: 'hsn', kind: 'text' },
      { name: 'uom', kind: 'text' },
    ],
  },
  invoices: {
    title: 'Invoice',
    endpoint: 'invoices',
    itemName: 'Invoice items',
    itemForeignKey: 'invoice_id',
    itemKind: 'taxable',
    fields: [
      ...textFields('invoice_no'),
      { name: 'invoice_date', kind: 'date', required: true },
      ...textFields('invoice_type', ['invoice_type']),
      ...textFields('dispatch_type'),
      ...numberFields('oc_id', 1),
      { name: 'proforma_invoice_id', kind: 'proforma-invoice' },
      { name: 'quotation_id', kind: 'quotation' },
      ...textFields('order_by asm order_approved_by'),
      ...textFields('consignee_customer_name consignee_pan consignee_gstn'),
      ...textFields('consignee_address_1 consignee_address_2 consignee_address_3'),
      { name: 'buyer_customer_id', kind: 'customer' },
      ...textFields('buyer_customer_name buyer_pan buyer_gstn'),
      ...textFields('buyer_address_1 buyer_address_2 buyer_address_3'),
      ...textFields('customer_purchase_order_no'),
      ...dateFields('po_date'),
      ...numberFields('total gst grand_total'),
      { name: 'generate_ewaybill', kind: 'boolean' },
      { name: 'terms_of_delivery', kind: 'textarea' },
      {
        name: 'terms_of_payment',
        kind: 'select',
        options: paymentTermsOptions,
      },
      ...textFields('created_by checked_by approved_by'),
    ],
    itemFields: [
      ...commonItemFields,
      { name: 'inventory_issue_id', kind: 'number', step: 1 },
    ],
  },
  'tax-invoices': {
    title: 'Tax Invoice',
    endpoint: 'tax-invoices',
    itemName: 'Tax invoice items',
    itemForeignKey: 'tax_invoice_id',
    itemKind: 'taxable',
    fields: [
      ...textFields('invoice_no'),
      { name: 'invoice_date', kind: 'date', required: true },
      ...textFields('invoice_type', ['invoice_type']),
      ...textFields('dispatch_type'),
      ...numberFields('oc_id', 1),
      { name: 'proforma_invoice_id', kind: 'proforma-invoice' },
      { name: 'quotation_id', kind: 'quotation' },
      ...textFields('order_by asm order_approved_by'),
      ...textFields('eway_bill_no'),
      ...dateFields('eway_bill_date'),
      { name: 'einvoice_details', kind: 'textarea' },
      ...textFields('isin_no einvoice_ack_no'),
      { name: 'einvoice_ack_date', kind: 'datetime-local' },
      ...textFields('delivery_challan_no'),
      ...dateFields('delivery_challan_date'),
      ...textFields('consignee_customer_name consignee_pan consignee_gstn'),
      ...textFields('consignee_address_1 consignee_address_2 consignee_address_3'),
      { name: 'buyer_customer_id', kind: 'customer' },
      ...textFields('buyer_customer_name buyer_pan buyer_gstn'),
      ...textFields('buyer_address_1 buyer_address_2 buyer_address_3'),
      ...textFields('purchase_order_no'),
      ...dateFields('purchase_order_date lr_date'),
      ...textFields('lr_no'),
      {
        name: 'terms_of_payment',
        kind: 'select',
        options: paymentTermsOptions,
      },
      { name: 'terms_of_delivery', kind: 'textarea' },
      ...textFields('transporter vehicle_no'),
      ...numberFields('total'),
      { name: 'amount_in_words', kind: 'textarea' },
      { name: 'remarks', kind: 'textarea' },
      ...textFields('company_pan company_gstn company_cin'),
      ...textFields('bank_name bank_branch bank_account_no bank_ifsc'),
      ...textFields('company_name authorised_signatory'),
      { name: 'company_address', kind: 'textarea' },
      { name: 'generate_einvoice', kind: 'boolean' },
      { name: 'generate_ewaybill', kind: 'boolean' },
    ],
    itemFields: commonItemFields,
  },
}

for (const definition of Object.values(arDocuments)) {
  for (const field of definition.fields) {
    if (['total', 'grand_total'].includes(field.name)) {
      field.readOnly = true
    }
    if (definition.endpoint !== 'quotations' && field.name === 'gst') {
      field.readOnly = true
    }
  }
}

export const arPages = [
  { label: 'Customer Master', path: '/ar/customers' },
  { label: 'Invoices', path: '/ar/invoices' },
  { label: 'Proforma Invoices', path: '/ar/proforma-invoices' },
  { label: 'Quotations', path: '/ar/quotations' },
  { label: 'Tax Invoices', path: '/ar/tax-invoices' },
]
