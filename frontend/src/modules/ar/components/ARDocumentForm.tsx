import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Divider,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { arDocuments } from '../constants/arResources'
import { useARRecords } from '../hooks/useARRecords'
import {
  deleteARRecord,
  formatARError,
  getARRecord,
  listARRecords,
  saveARRecord,
} from '../services/arApi'
import type {
  ARDocumentDefinition,
  ARFieldDefinition,
  ARRecord,
} from '../types/arTypes'
import ARExcelUpload from './ARExcelUpload'
import ARPageLayout from './ARPageLayout'
import { sortOptionsByLabel } from '../../../utils/sortOptions'
import { normalizeARValue, validateARValue } from '../utils/arValidation'
import { numberToIndianRupeesWords } from '../utils/numberToIndianRupeesWords'

type HeaderValues = Record<string, string | number | boolean>
type LookupValues = Record<string, ARRecord[]>

const lookupResources = ['customers', 'quotations', 'proforma-invoices'] as const
const directQuotationOption = '__direct__'
const QUOTATION_GST_RATE = 18

const DELIVERY_TERMS_OPTIONS = [
  'Ex-Works',
  'FOR Destination',
  'Door Delivery',
  'FOB',
  'CIF',
  'C&F',
]

const invoiceAddressFields = new Set([
  'consignee_customer_name',
  'consignee_address_1',
  'consignee_address_2',
  'consignee_address_3',
  'consignee_pan',
  'consignee_gstn',
  'buyer_customer_id',
  'buyer_customer_name',
  'buyer_address_1',
  'buyer_address_2',
  'buyer_address_3',
  'buyer_pan',
  'buyer_gstn',
])

const taxInvoiceHeaderFields = new Set([
  'invoice_no',
  'invoice_date',
  'invoice_type',
  'dispatch_type',
  'oc_id',
  'proforma_invoice_id',
  'quotation_id',
  'order_by',
  'asm',
  'order_approved_by',
  'eway_bill_no',
  'eway_bill_date',
  'einvoice_details',
  'isin_no',
  'einvoice_ack_no',
  'einvoice_ack_date',
  'delivery_challan_no',
  'delivery_challan_date',
])

const taxInvoiceOrderFields = new Set([
  'purchase_order_no',
  'purchase_order_date',
  'lr_no',
  'lr_date',
  'terms_of_payment',
  'terms_of_delivery',
  'transporter',
  'vehicle_no',
])

const taxInvoiceCompanyFields = new Set([
  'company_pan',
  'company_gstn',
  'company_cin',
  'bank_name',
  'bank_branch',
  'bank_account_no',
  'bank_ifsc',
  'company_name',
  'company_address',
  'authorised_signatory',
  'remarks',
])

function today(): string {
  const date = new Date()

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function blankValues(definition: ARDocumentDefinition): HeaderValues {
  return Object.fromEntries(
    definition.fields.map((field) => [
      field.name,
      field.kind === 'boolean'
        ? false
        : field.kind === 'date' && field.required
          ? today()
          : '',
    ]),
  )
}

function asNumber(value: unknown): number {
  const number = Number(value ?? 0)
  return Number.isFinite(number) ? number : 0
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Quantity and Rate increment steps:
 * 5 -> 1, 50 -> 10, 500 -> 100, 5000 -> 1000.
 */
function getQuantityRateStep(value: unknown): number {
  const number = Math.abs(asNumber(value))

  if (number < 10) return 1
  if (number < 100) return 10
  if (number < 1000) return 100

  return 10 ** Math.floor(Math.log10(number))
}

function blankItem(
  definition: ARDocumentDefinition,
  index: number,
): ARRecord {
  return Object.fromEntries(
    definition.itemFields.map((field) => [
      field.name,
      field.name === 'sl_no' || field.name === 'item_no'
        ? index + 1
        : field.kind === 'boolean'
          ? false
          : '',
    ]),
  ) as ARRecord
}

function calculateItem(
  definition: ARDocumentDefinition,
  item: ARRecord,
): ARRecord {
  const quantity = asNumber(item.quantity)
  const rate = asNumber(item.rate)

  if (definition.itemKind === 'quotation') {
    return {
      ...item,
      amount: roundMoney(quantity * rate),
    }
  }

  const value = roundMoney(quantity * rate)
  const tax = roundMoney((value * asNumber(item.gst_rate)) / 100)

  return {
    ...item,
    value,
    tax,
    total_amount: roundMoney(value + tax),
  }
}

function fieldLabel(name: string): string {
  const acronyms: Record<string, string> = {
    asm: 'ASM',
    einvoice: 'e-Invoice',
    gst: 'GST',
    gstn: 'GSTIN',
    hsn: 'HSN',
    ifsc: 'IFSC',
    isin: 'ISIN',
    lr: 'LR',
    msme: 'MSME',
    oc: 'OC',
    pan: 'PAN',
    po: 'PO',
    uom: 'UOM',
  }

  return name
    .split('_')
    .map(
      (part) =>
        acronyms[part] ??
        `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`,
    )
    .join(' ')
}

function invoiceFieldLabel(name: string): string {
  if (name === 'sl_no') return 'Sl. No.'
  if (name === 'proforma_invoice_id') {
    return 'Restore from Proforma Invoice'
  }
  if (name === 'quotation_id') return 'Restore from Quotation'

  if (
    name === 'consignee_customer_name' ||
    name === 'buyer_customer_name'
  ) {
    return 'Customer Name'
  }

  if (name.startsWith('consignee_address_')) return 'Address'
  if (name.startsWith('buyer_address_')) return 'Address of Delivery'

  return fieldLabel(name)
}

function fieldValue(
  record: ARRecord,
  field: ARFieldDefinition,
): string | boolean {
  const value = record[field.name]

  if (field.kind === 'boolean') return value === true
  if (value === null || value === undefined) return ''
  if (field.kind === 'date') return String(value).slice(0, 10)

  if (field.kind === 'datetime-local') {
    return String(value).replace(' ', 'T').slice(0, 16)
  }

  return String(value)
}

function nestedItems(record: ARRecord): ARRecord[] {
  const value = record.items

  if (!Array.isArray(value)) return []

  return value.filter(
    (item): item is ARRecord =>
      typeof item === 'object' &&
      item !== null &&
      !Array.isArray(item),
  )
}

function existingOCIds(lookups: LookupValues): string[] {
  const ids = new Set<string>()

  for (const resource of [
    'proforma-invoices',
    'invoices',
    'tax-invoices',
  ]) {
    for (const record of lookups[resource] ?? []) {
      const id = record.oc_id

      if (id !== null && id !== undefined && String(id).trim()) {
        ids.add(String(id))
      }
    }
  }

  return Array.from(ids).sort((left, right) =>
    left.localeCompare(right, undefined, { numeric: true }),
  )
}

function existingDispatchTypes(lookups: LookupValues): string[] {
  const types = new Set<string>(['OC Site'])

  for (const resource of [
    'proforma-invoices',
    'invoices',
    'tax-invoices',
  ]) {
    for (const record of lookups[resource] ?? []) {
      const dispatchType = record.dispatch_type

      if (typeof dispatchType === 'string' && dispatchType.trim()) {
        types.add(dispatchType.trim())
      }
    }
  }

  return Array.from(types).sort((left, right) =>
    left.localeCompare(right),
  )
}

function relatedLabel(resource: string, record: ARRecord): string {
  const nameField =
    resource === 'customers'
      ? 'customer_name'
      : resource === 'quotations'
        ? 'quotation_no'
        : 'proforma_invoice_no'

  return String(record[nameField] ?? `Record #${String(record.id ?? '')}`)
}

function recordLabel(
  definition: ARDocumentDefinition,
  record: ARRecord,
): string {
  const idField =
    definition.endpoint === 'quotations'
      ? 'quotation_no'
      : definition.endpoint === 'proforma-invoices'
        ? 'proforma_invoice_no'
        : 'invoice_no'

  return String(record[idField] ?? `Record #${String(record.id ?? '')}`)
}

function rowIsEmpty(
  definition: ARDocumentDefinition,
  item: ARRecord,
): boolean {
  const descriptionField =
    definition.itemKind === 'quotation'
      ? 'product_item_description'
      : 'description'

  return !String(item[descriptionField] ?? '').trim()
}

interface ARDocumentFormProps {
  resource: keyof typeof arDocuments
}

export default function ARDocumentForm({
  resource,
}: ARDocumentFormProps) {
  const definition = arDocuments[resource]
  const isQuotation = resource === 'quotations'
  const isInvoice = resource === 'invoices'
  const isTaxInvoice = resource === 'tax-invoices'

  const { records, loading, error, reload, setError } =
    useARRecords(definition.endpoint)

  const [values, setValues] = useState<HeaderValues>(
    () => blankValues(definition),
  )
  const [items, setItems] = useState<ARRecord[]>([
    blankItem(definition, 0),
  ])
  const [lookups, setLookups] = useState<LookupValues>({})
  const [lookupError, setLookupError] = useState('')
  const [editingId, setEditingId] = useState<number>()
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')

  useEffect(() => {
    let active = true
    const resourcesToLoad: string[] = [...lookupResources]

    if (resource === 'proforma-invoices') {
      resourcesToLoad.push('invoices', 'tax-invoices')
    }

    void Promise.all(
      resourcesToLoad.map(
        async (lookup) =>
          [lookup, await listARRecords(lookup)] as const,
      ),
    )
      .then((results) => {
        if (active) {
          setLookups(Object.fromEntries(results))
          setLookupError('')
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setLookupError(
            formatARError(
              loadError,
              'Unable to load AR dropdown values.',
            ),
          )
        }
      })

    return () => {
      active = false
    }
  }, [resource])

  const calculatedItems = useMemo(
    () => items.map((item) => calculateItem(definition, item)),
    [definition, items],
  )

  const totals = useMemo(() => {
    if (definition.itemKind === 'quotation') {
      const total = roundMoney(
        calculatedItems.reduce(
          (sum, item) => sum + asNumber(item.amount),
          0,
        ),
      )

      const gst = roundMoney(
        (total * QUOTATION_GST_RATE) / 100,
      )

      return {
        total,
        gst,
        grandTotal: roundMoney(total + gst),
      }
    }

    const total = roundMoney(
      calculatedItems.reduce(
        (sum, item) => sum + asNumber(item.value),
        0,
      ),
    )

    const gst = roundMoney(
      calculatedItems.reduce(
        (sum, item) => sum + asNumber(item.tax),
        0,
      ),
    )

    const grandTotal = roundMoney(
      calculatedItems.reduce(
        (sum, item) => sum + asNumber(item.total_amount),
        0,
      ),
    )

    return { total, gst, grandTotal }
  }, [calculatedItems, definition.itemKind])

  const displayedItemFields = isInvoice
    ? definition.itemFields.filter(
        (field) => field.name !== 'inventory_issue_id',
      )
    : definition.itemFields

  const reset = useCallback(() => {
    setValues(blankValues(definition))
    setItems([blankItem(definition, 0)])
    setEditingId(undefined)
    setNotice('')
    setError('')
  }, [definition, setError])

  const selectRecord = async (record: ARRecord) => {
    if (record.id === undefined) return

    try {
      const detail = await getARRecord(
        definition.endpoint,
        record.id,
      )
      const nextValues = blankValues(definition)

      for (const field of definition.fields) {
        nextValues[field.name] = fieldValue(detail, field)
      }

      const recordItems = nestedItems(detail)

      setValues(nextValues)

      setItems(
        recordItems.length
          ? recordItems.map((item) => {
              const next = { ...item }

              for (const field of definition.itemFields) {
                next[field.name] = fieldValue(item, field)
              }

              return next
            })
          : [blankItem(definition, 0)],
      )

      setEditingId(detail.id)
      setNotice('')
      setError('')
    } catch (loadError) {
      setError(
        formatARError(
          loadError,
          `Unable to load this ${definition.title.toLowerCase()}.`,
        ),
      )
    }
  }

  const updateHeader = (
    field: ARFieldDefinition,
    value: string | boolean,
  ) => {
    const normalizedValue =
      typeof value === 'string'
        ? normalizeARValue(field.name, value)
        : value

    setValues((current) => {
      const next = {
        ...current,
        [field.name]: normalizedValue,
      }

      if (
        resource === 'proforma-invoices' &&
        field.name === 'dispatch_type'
      ) {
        next.oc_id = ''
      }

      return next
    })

    if (field.kind === 'customer' && value !== '') {
      const customer = (lookups.customers ?? []).find(
        (record) => String(record.id) === String(value),
      )

      if (customer) {
        const prefix = field.name === 'customer_id' ? '' : 'buyer_'

        const keys: Record<string, string> = {
          [`${prefix}customer_name`]: 'customer_name',
          [`${prefix}address_1`]: 'address_1',
          [`${prefix}address_2`]: 'address_2',
          [`${prefix}address_3`]: 'address_3',
          [`${prefix}pan`]: 'pan',
          [`${prefix}gstn`]: 'gstn',
        }

        setValues((current) => {
          const next = { ...current }

          for (const [target, source] of Object.entries(keys)) {
            if (
              definition.fields.some(
                (candidate) => candidate.name === target,
              )
            ) {
              next[target] = String(customer[source] ?? '')
            }
          }

          if (
            definition.fields.some(
              (candidate) => candidate.name === 'vendor_name',
            )
          ) {
            next.vendor_name = String(customer.customer_name ?? '')
          }

          if (
            definition.fields.some(
              (candidate) => candidate.name === 'address',
            )
          ) {
            next.address = String(customer.bill_to_address ?? '')
          }

          return next
        })
      }
    }
  }

  const selectQuotation = async (value: string) => {
    const clearQuotationDetails = (quotationValue: string) => {
      setValues((current) => ({
        ...current,
        quotation_id: quotationValue,
        buyer_customer_id: '',
        buyer_customer_name: '',
        buyer_address_1: '',
        buyer_address_2: '',
        buyer_address_3: '',
        buyer_pan: '',
        buyer_gstn: '',
      }))

      setItems([blankItem(definition, 0)])
      setError('')
    }

    if (value === directQuotationOption || value === '') {
      clearQuotationDetails(value)
      return
    }

    const quotationId = Number(value)

    if (!Number.isSafeInteger(quotationId) || quotationId <= 0) {
      setError('Select a valid quotation.')
      return
    }

    try {
      const quotation = await getARRecord(
        'quotations',
        quotationId,
      )

      const customerId = Number(quotation.customer_id)

      const customer =
        (lookups.customers ?? []).find(
          (record) => Number(record.id) === customerId,
        ) ??
        (Number.isSafeInteger(customerId) && customerId > 0
          ? await getARRecord('customers', customerId)
          : undefined)

      const quotationItems = nestedItems(quotation)

      const nextItems = quotationItems.map((item, index) => {
        const next = blankItem(definition, index)

        next.sl_no = Number(item.item_no ?? index + 1)
        next.description = String(
          item.product_item_description ?? '',
        )
        next.quantity = String(item.quantity ?? '')
        next.rate = String(item.rate ?? '')

        return calculateItem(definition, next)
      })

      setValues((current) => ({
        ...current,
        quotation_id: value,
        buyer_customer_id: customer
          ? String(customer.id ?? '')
          : '',
        buyer_customer_name: String(
          customer?.customer_name ?? '',
        ),
        buyer_address_1: String(customer?.address_1 ?? ''),
        buyer_address_2: String(customer?.address_2 ?? ''),
        buyer_address_3: String(customer?.address_3 ?? ''),
        buyer_pan: String(customer?.pan ?? ''),
        buyer_gstn: String(customer?.gstn ?? ''),
      }))

      setItems(
        nextItems.length
          ? nextItems
          : [blankItem(definition, 0)],
      )

      setError('')
    } catch (loadError) {
      setError(
        formatARError(
          loadError,
          'Unable to load quotation customer and item details.',
        ),
      )
    }
  }

  const selectInvoiceSource = async (
    sourceField: 'proforma_invoice_id' | 'quotation_id',
    value: string,
  ) => {
    const otherSourceField =
      sourceField === 'proforma_invoice_id'
        ? 'quotation_id'
        : 'proforma_invoice_id'

    if (!value) {
      setValues((current) => ({
        ...current,
        [sourceField]: '',
        [otherSourceField]: '',
      }))
      return
    }

    const sourceId = Number(value)

    if (!Number.isSafeInteger(sourceId) || sourceId <= 0) {
      setError('Select a valid source record.')
      return
    }

    try {
      const source = await getARRecord(
        sourceField === 'proforma_invoice_id'
          ? 'proforma-invoices'
          : 'quotations',
        sourceId,
      )

      let headerValues: Record<
        string,
        string | number | boolean
      > = {}

      let restoredItems: ARRecord[] = []

      if (sourceField === 'proforma_invoice_id') {
        headerValues = {
          consignee_customer_name: String(
            source.consignee_customer_name ?? '',
          ),
          consignee_address_1: String(
            source.consignee_address_1 ?? '',
          ),
          consignee_address_2: String(
            source.consignee_address_2 ?? '',
          ),
          consignee_address_3: String(
            source.consignee_address_3 ?? '',
          ),
          consignee_pan: String(source.consignee_pan ?? ''),
          consignee_gstn: String(source.consignee_gstn ?? ''),
          buyer_customer_id: source.buyer_customer_id
            ? Number(source.buyer_customer_id)
            : '',
          buyer_customer_name: String(
            source.buyer_customer_name ?? '',
          ),
          buyer_address_1: String(
            source.buyer_address_1 ?? '',
          ),
          buyer_address_2: String(
            source.buyer_address_2 ?? '',
          ),
          buyer_address_3: String(
            source.buyer_address_3 ?? '',
          ),
          buyer_pan: String(source.buyer_pan ?? ''),
          buyer_gstn: String(source.buyer_gstn ?? ''),
          customer_purchase_order_no: String(
            source.customer_purchase_order_no ?? '',
          ),
          purchase_order_no: String(
            source.customer_purchase_order_no ?? '',
          ),
          purchase_order_date: source.po_date
            ? String(source.po_date).slice(0, 10)
            : '',
          po_date: source.po_date
            ? String(source.po_date).slice(0, 10)
            : '',
          terms_of_delivery: String(
            source.terms_of_delivery ?? '',
          ),
          terms_of_payment: String(
            source.terms_of_payment ?? '',
          ),
        }

        restoredItems = nestedItems(source).map(
          (sourceItem, index) => {
            const item = blankItem(definition, index)

            for (const field of definition.itemFields) {
              if (field.name in sourceItem) {
                item[field.name] = fieldValue(
                  sourceItem,
                  field,
                )
              }
            }

            return calculateItem(definition, item)
          },
        )
      } else {
        const customerId = Number(source.customer_id)

        if (
          !Number.isSafeInteger(customerId) ||
          customerId <= 0
        ) {
          throw new Error(
            'The selected quotation has no valid customer.',
          )
        }

        const customer =
          (lookups.customers ?? []).find(
            (record) => Number(record.id) === customerId,
          ) ??
          (await getARRecord('customers', customerId))

        const shipToFirst =
          customer.ship_to_address_1 ??
          customer.ship_to_address ??
          ''

        headerValues = {
          consignee_customer_name: String(
            customer.customer_name ?? '',
          ),
          consignee_address_1: String(shipToFirst),
          consignee_address_2: String(
            customer.ship_to_address_2 ?? '',
          ),
          consignee_address_3: String(
            customer.ship_to_address_3 ?? '',
          ),
          consignee_pan: String(customer.pan ?? ''),
          consignee_gstn: String(customer.gstn ?? ''),
          buyer_customer_id: customerId,
          buyer_customer_name: String(
            customer.customer_name ?? '',
          ),
          buyer_address_1: String(
            customer.address_1 ??
              customer.bill_to_address ??
              '',
          ),
          buyer_address_2: String(customer.address_2 ?? ''),
          buyer_address_3: String(customer.address_3 ?? ''),
          buyer_pan: String(customer.pan ?? ''),
          buyer_gstn: String(customer.gstn ?? ''),
          customer_purchase_order_no: '',
          purchase_order_no: '',
          purchase_order_date: '',
          po_date: '',
          terms_of_delivery: '',
          terms_of_payment: '',
        }

        restoredItems = nestedItems(source).map(
          (sourceItem, index) => {
            const item = blankItem(definition, index)

            item.sl_no = Number(
              sourceItem.item_no ?? index + 1,
            )
            item.description = String(
              sourceItem.product_item_description ?? '',
            )
            item.quantity = String(sourceItem.quantity ?? '')
            item.rate = String(sourceItem.rate ?? '')

            return calculateItem(definition, item)
          },
        )
      }

      setValues((current) => ({
        ...current,
        [sourceField]: sourceId,
        [otherSourceField]: '',
        ...headerValues,
      }))

      setItems(
        restoredItems.length
          ? restoredItems
          : [blankItem(definition, 0)],
      )

      setError('')
    } catch (loadError) {
      setError(
        formatARError(
          loadError,
          'Unable to restore invoice details from the selected source.',
        ),
      )
    }
  }

  const updateItem = (
    index: number,
    field: ARFieldDefinition,
    value: string,
  ) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? calculateItem(definition, {
              ...item,
              [field.name]: value,
            })
          : item,
      ),
    )
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const missing = definition.fields.find((field) => {
      const value = values[field.name]

      return (
        field.required &&
        (value === '' || value === undefined)
      )
    })

    if (missing) {
      setError(`${fieldLabel(missing.name)} is required.`)
      return
    }

    for (const field of definition.fields) {
      const validationError = validateARValue(
        field.name,
        values[field.name],
      )

      if (validationError) {
        setError(validationError)
        return
      }
    }

    const activeItems = calculatedItems.filter(
      (item) => !rowIsEmpty(definition, item),
    )

    if (activeItems.length === 0) {
      setError(
        'Add at least one item before saving this document.',
      )
      return
    }

    if (
      activeItems.some((item) =>
        definition.itemFields.some((field) => {
          const value = item[field.name]

          return (
            field.required &&
            (value === '' || value === undefined)
          )
        }),
      )
    ) {
      setError(
        'Complete all required item fields before saving.',
      )
      return
    }

    const payload: Record<string, unknown> = {}

    for (const field of definition.fields) {
      let value = values[field.name]

      if (
        isTaxInvoice &&
        field.name === 'amount_in_words' &&
        !String(value ?? '').trim()
      ) {
        value = numberToIndianRupeesWords(
          totals.grandTotal,
        )
      }

      if (field.kind === 'boolean') {
        payload[field.name] = value === true
      } else if (
        field.name === 'quotation_id' &&
        value === directQuotationOption
      ) {
        payload[field.name] = null
      } else if (value === '') {
        if (field.name !== 'quotation_no') {
          payload[field.name] = null
        }
      } else if (
        field.kind === 'number' ||
        field.kind === 'customer' ||
        field.kind === 'quotation' ||
        field.kind === 'proforma-invoice'
      ) {
        const number = Number(value)

        if (!Number.isFinite(number)) {
          setError(
            `${fieldLabel(field.name)} must be a valid number.`,
          )
          return
        }

        payload[field.name] = number
      } else {
        payload[field.name] = value
      }
    }

    if (
      definition.fields.some(
        (field) => field.name === 'total',
      )
    ) {
      payload.total = isTaxInvoice
        ? totals.grandTotal
        : totals.total
    }

    if (
      definition.fields.some(
        (field) => field.name === 'gst',
      )
    ) {
      payload.gst = totals.gst
    }

    if (
      definition.fields.some(
        (field) => field.name === 'grand_total',
      )
    ) {
      payload.grand_total = totals.grandTotal
    }

    if (isTaxInvoice) {
      payload.amount_in_words =
        String(values.amount_in_words ?? '').trim() ||
        numberToIndianRupeesWords(totals.grandTotal)
    }

    payload.items = activeItems.map((item) => {
      const row: Record<string, unknown> = {}

      for (const field of definition.itemFields) {
        const value = item[field.name]

        if (field.kind === 'number') {
          row[field.name] =
            value === '' ? 0 : asNumber(value)
        } else if (
          value === '' ||
          value === undefined
        ) {
          row[field.name] = null
        } else {
          row[field.name] = value
        }
      }

      return row
    })

    setSaving(true)
    setNotice('')

    try {
      await saveARRecord(
        definition.endpoint,
        payload,
        editingId,
      )

      const successMessage = editingId
        ? `${definition.title} updated successfully.`
        : `${definition.title} saved successfully.`

      reset()
      setSaveSuccess(successMessage)
      await reload()
    } catch (saveError) {
      setError(
        formatARError(
          saveError,
          `Unable to save ${definition.title.toLowerCase()}.`,
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  const remove = async (recordId: number) => {
    if (
      !window.confirm(
        `Delete this ${definition.title.toLowerCase()}?`,
      )
    ) {
      return
    }

    try {
      await deleteARRecord(
        definition.endpoint,
        recordId,
      )

      if (editingId === recordId) {
        reset()
      }

      await reload()
      setNotice(`${definition.title} deleted.`)
    } catch (deleteError) {
      setError(
        formatARError(
          deleteError,
          `Unable to delete ${definition.title.toLowerCase()}.`,
        ),
      )
    }
  }

  const selectOptions = (
    field: ARFieldDefinition,
  ): ARRecord[] => {
    if (field.kind === 'customer') {
      return lookups.customers ?? []
    }

    if (field.kind === 'quotation') {
      return lookups.quotations ?? []
    }

    if (field.kind === 'proforma-invoice') {
      return lookups['proforma-invoices'] ?? []
    }

    return []
  }

  const renderField = (field: ARFieldDefinition) => {
    const baseLabel =
      isInvoice || isTaxInvoice
        ? invoiceFieldLabel(field.name)
        : fieldLabel(field.name)

    const label =
      isQuotation && field.name === 'gst'
        ? 'GST (18%)'
        : baseLabel

    const value =
      field.name === 'total'
        ? isTaxInvoice
          ? totals.grandTotal
          : totals.total
        : field.name === 'gst' &&
            (definition.itemKind === 'taxable' || isQuotation)
          ? totals.gst
          : field.name === 'grand_total'
            ? totals.grandTotal
            : isTaxInvoice &&
                field.name === 'amount_in_words'
              ? values.amount_in_words ||
                numberToIndianRupeesWords(
                  totals.grandTotal,
                )
              : values[field.name] ?? ''

    if (field.kind === 'boolean') {
      return (
        <FormControlLabel
          control={
            <Checkbox
              checked={value === true}
              onChange={(event) =>
                updateHeader(field, event.target.checked)
              }
            />
          }
          label={label}
        />
      )
    }

    if (
      field.kind === 'customer' ||
      field.kind === 'quotation' ||
      field.kind === 'proforma-invoice'
    ) {
      const isQuotationField =
        resource === 'proforma-invoices' &&
        field.name === 'quotation_id'

      const isInvoiceSource =
        (isInvoice || isTaxInvoice) &&
        (field.name === 'quotation_id' ||
          field.name === 'proforma_invoice_id')

      return (
        <TextField
          fullWidth
          label={label}
          onChange={(event) => {
            if (isInvoiceSource) {
              void selectInvoiceSource(
                field.name as
                  | 'proforma_invoice_id'
                  | 'quotation_id',
                event.target.value,
              )
            } else if (isQuotationField) {
              void selectQuotation(event.target.value)
            } else {
              updateHeader(field, event.target.value)
            }
          }}
          required={field.required}
          select
          value={value}
        >
          <MenuItem value="">None</MenuItem>

          {sortOptionsByLabel(
            selectOptions(field),
            (record) =>
              relatedLabel(
                field.kind === 'customer'
                  ? 'customers'
                  : field.kind === 'quotation'
                    ? 'quotations'
                    : 'proforma-invoices',
                record,
              ),
          ).map((record) => (
            <MenuItem
              key={record.id}
              value={String(record.id ?? '')}
            >
              {relatedLabel(
                field.kind === 'customer'
                  ? 'customers'
                  : field.kind === 'quotation'
                    ? 'quotations'
                    : 'proforma-invoices',
                record,
              )}
            </MenuItem>
          ))}

          {isQuotationField && (
            <MenuItem value={directQuotationOption}>
              Direct
            </MenuItem>
          )}
        </TextField>
      )
    }

    if (
      resource === 'proforma-invoices' &&
      field.name === 'oc_id' &&
      String(values.dispatch_type ?? '')
        .trim()
        .toLowerCase() === 'oc site'
    ) {
      return (
        <TextField
          fullWidth
          label="OC Type"
          onChange={(event) =>
            updateHeader(field, event.target.value)
          }
          select
          value={value}
        >
          <MenuItem value="">None</MenuItem>

          {existingOCIds(lookups).map((ocId) => (
            <MenuItem key={ocId} value={ocId}>
              {ocId}
            </MenuItem>
          ))}
        </TextField>
      )
    }

    // Terms of Delivery: always show the dropdown options.
    if (field.name === 'terms_of_delivery') {
      const currentValue =
        typeof value === 'string' ? value : ''

      const options = Array.from(
        new Set([
          ...DELIVERY_TERMS_OPTIONS,
          ...(currentValue ? [currentValue] : []),
        ]),
      )

      return (
        <TextField
          fullWidth
          label={label}
          onChange={(event) =>
            updateHeader(field, event.target.value)
          }
          required={field.required}
          select
          value={currentValue}
        >
          <MenuItem value="">
            Select Terms of Delivery
          </MenuItem>

          {options.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      )
    }

    if (field.kind === 'select') {
      const options =
        resource === 'proforma-invoices' &&
        field.name === 'dispatch_type'
          ? existingDispatchTypes(lookups)
          : field.options ?? []

      return (
        <TextField
          fullWidth
          label={label}
          onChange={(event) =>
            updateHeader(field, event.target.value)
          }
          required={field.required}
          select
          value={value}
        >
          <MenuItem value="">None</MenuItem>

          {options.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      )
    }

    return (
      <TextField
        fullWidth
        label={label}
        multiline={field.kind === 'textarea'}
        minRows={
          field.kind === 'textarea' ? 2 : undefined
        }
        onChange={(event) =>
          updateHeader(field, event.target.value)
        }
        required={field.required}
        slotProps={{
          htmlInput: {
            readOnly:
              field.readOnly ||
              (isTaxInvoice &&
                field.name === 'amount_in_words') ||
              (isQuotation && field.name === 'gst'),
            step: field.step,
          },
        }}
        type={
          field.kind === 'number' ||
          field.kind === 'date' ||
          field.kind === 'datetime-local'
            ? field.kind
            : 'text'
        }
        value={value}
      />
    )
  }

  const renderFields = (fieldNames: Set<string>) =>
    definition.fields
      .filter((field) => fieldNames.has(field.name))
      .map((field) => (
        <Grid
          key={field.name}
          size={{
            xs: 12,
            md: field.kind === 'textarea' ? 12 : 6,
          }}
        >
          {renderField(field)}
        </Grid>
      ))

  const renderAddressPanel = (
    title: string,
    prefix: 'consignee' | 'buyer',
  ) => (
    <Grid size={{ xs: 12, md: 6 }}>
      <Paper
        sx={{ p: 2, height: '100%' }}
        variant="outlined"
      >
        <Stack spacing={1.5}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700 }}
          >
            {title}
          </Typography>

          {definition.fields
            .filter((field) =>
              prefix === 'consignee'
                ? field.name.startsWith('consignee_')
                : field.name.startsWith('buyer_'),
            )
            .map((field) => (
              <div key={field.name}>
                {renderField(field)}
              </div>
            ))}
        </Stack>
      </Paper>
    </Grid>
  )

  return (
    <ARPageLayout
      title={`${definition.title} Creation / Alteration`}
    >
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        autoHideDuration={5000}
        onClose={() => setSaveSuccess('')}
        open={Boolean(saveSuccess)}
      >
        <Alert
          onClose={() => setSaveSuccess('')}
          severity="success"
          variant="filled"
        >
          {saveSuccess}
        </Alert>
      </Snackbar>

      <Stack spacing={2}>
        {(error || lookupError || notice) && (
          <Alert
            severity={
              error || lookupError ? 'error' : 'success'
            }
          >
            {error || lookupError || notice}
          </Alert>
        )}

        <Paper
          component="form"
          onSubmit={submit}
          sx={{ p: 3 }}
        >
          <Stack spacing={3}>
            <Typography variant="h6">
              {editingId
                ? `Edit ${definition.title} #${editingId}`
                : `${definition.title} details`}
            </Typography>

            {lookupError && (
              <Typography
                color="error"
                variant="body2"
              >
                Dropdown loading failed. Retry by reloading
                this page.
              </Typography>
            )}

            {isTaxInvoice ? (
              <>
                <Paper
                  variant="outlined"
                  sx={{ p: 2 }}
                >
                  <Stack spacing={2}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        textAlign: 'center',
                      }}
                    >
                      TAX INVOICE
                    </Typography>

                    <Divider />

                    <Grid container spacing={2}>
                      {renderFields(
                        taxInvoiceHeaderFields,
                      )}
                    </Grid>
                  </Stack>
                </Paper>

                <Grid container spacing={2}>
                  {renderAddressPanel(
                    'Consignee (Ship to)',
                    'consignee',
                  )}

                  {renderAddressPanel(
                    'Buyer (Bill to)',
                    'buyer',
                  )}
                </Grid>

                <Paper
                  variant="outlined"
                  sx={{ p: 2 }}
                >
                  <Stack spacing={2}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 700 }}
                    >
                      Purchase Order & Dispatch Details
                    </Typography>

                    <Grid container spacing={2}>
                      {renderFields(
                        taxInvoiceOrderFields,
                      )}
                    </Grid>
                  </Stack>
                </Paper>
              </>
            ) : (
              <>
                <Grid container spacing={2}>
                  {definition.fields
                    .filter(
                      (field) =>
                        !isInvoice ||
                        !invoiceAddressFields.has(
                          field.name,
                        ),
                    )
                    .map((field) => (
                      <Grid
                        key={field.name}
                        size={{
                          xs: 12,
                          md:
                            field.kind === 'textarea'
                              ? 12
                              : 6,
                        }}
                      >
                        {renderField(field)}
                      </Grid>
                    ))}
                </Grid>

                {isInvoice && (
                  <Grid container spacing={2}>
                    {renderAddressPanel(
                      'Consignee (Ship to)',
                      'consignee',
                    )}

                    {renderAddressPanel(
                      'Buyer (Bill to)',
                      'buyer',
                    )}
                  </Grid>
                )}
              </>
            )}

            <Stack spacing={1}>
              <Stack
                direction="row"
                sx={{
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography variant="h6">
                  {definition.itemName}
                </Typography>

                <Button
                  onClick={() =>
                    setItems((current) => [
                      ...current,
                      blankItem(
                        definition,
                        current.length,
                      ),
                    ])
                  }
                  variant="outlined"
                >
                  Add Item
                </Button>
              </Stack>

              <TableContainer
                component={Paper}
                variant="outlined"
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {displayedItemFields.map(
                        (field) => (
                          <TableCell key={field.name}>
                            {isInvoice || isTaxInvoice
                              ? invoiceFieldLabel(
                                  field.name,
                                )
                              : fieldLabel(field.name)}
                          </TableCell>
                        ),
                      )}

                      <TableCell align="right">
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {calculatedItems.map(
                      (item, index) => (
                        <TableRow key={index}>
                          {displayedItemFields.map(
                            (field) => (
                              <TableCell key={field.name}>
                                <TextField
                                  fullWidth
                                  label={
                                    isInvoice ||
                                    isTaxInvoice
                                      ? invoiceFieldLabel(
                                          field.name,
                                        )
                                      : fieldLabel(
                                          field.name,
                                        )
                                  }
                                  multiline={
                                    field.kind ===
                                    'textarea'
                                  }
                                  minRows={
                                    field.kind ===
                                    'textarea'
                                      ? 2
                                      : undefined
                                  }
                                  onChange={(event) =>
                                    updateItem(
                                      index,
                                      field,
                                      event.target.value,
                                    )
                                  }
                                  required={field.required}
                                  slotProps={{
                                    htmlInput: {
                                      readOnly:
                                        field.readOnly,
                                      step:
                                        field.name === 'quantity' ||
                                        field.name === 'rate'
                                          ? getQuantityRateStep(
                                              item[field.name],
                                            )
                                          : field.step,
                                    },
                                  }}
                                  type={
                                    field.kind === 'number'
                                      ? 'number'
                                      : 'text'
                                  }
                                  value={
                                    item[field.name] ?? ''
                                  }
                                />
                              </TableCell>
                            ),
                          )}

                          <TableCell align="right">
                            <Button
                              color="error"
                              disabled={
                                calculatedItems.length === 1
                              }
                              onClick={() =>
                                setItems((current) =>
                                  current.filter(
                                    (_, rowIndex) =>
                                      rowIndex !== index,
                                  ),
                                )
                              }
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {isInvoice || isTaxInvoice ? (
                <Paper
                  variant="outlined"
                  sx={{ p: 2 }}
                >
                  <Stack
                    spacing={0.5}
                    sx={{ alignItems: 'flex-end' }}
                  >
                    <Typography>
                      Subtotal: ₹
                      {totals.total.toFixed(2)}
                    </Typography>

                    <Typography>
                      GST: ₹{totals.gst.toFixed(2)}
                    </Typography>

                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700 }}
                    >
                      Grand Total: ₹
                      {totals.grandTotal.toFixed(2)}
                    </Typography>
                  </Stack>
                </Paper>
              ) : (
                <Typography
                  align="right"
                  variant="subtitle1"
                >
                  Total: ₹{totals.total.toFixed(2)}
                  {definition.fields.some(
                    (field) => field.name === 'gst',
                  ) &&
                    `  |  GST (18%): ₹${totals.gst.toFixed(2)}`}
                  {definition.fields.some(
                    (field) =>
                      field.name === 'grand_total',
                  ) &&
                    `  |  Grand total: ₹${totals.grandTotal.toFixed(2)}`}
                </Typography>
              )}

              {(isInvoice || isTaxInvoice) && (
                <Paper
                  variant="outlined"
                  sx={{ p: 2 }}
                >
                  <Typography variant="subtitle2">
                    Value in Rupees:
                  </Typography>

                  <Typography>
                    {numberToIndianRupeesWords(
                      totals.grandTotal,
                    )}
                  </Typography>
                </Paper>
              )}
            </Stack>

            {isTaxInvoice && (
              <>
                <Paper
                  variant="outlined"
                  sx={{ p: 2 }}
                >
                  <Stack spacing={2}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 700 }}
                    >
                      Remarks & Company Details
                    </Typography>

                    <Grid container spacing={2}>
                      {renderFields(
                        taxInvoiceCompanyFields,
                      )}
                    </Grid>
                  </Stack>
                </Paper>

                <Paper
                  variant="outlined"
                  sx={{ p: 2 }}
                >
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 8 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700 }}
                      >
                        Bank Details
                      </Typography>

                      <Typography variant="body2">
                        Bank:{' '}
                        {String(values.bank_name || '—')}
                      </Typography>

                      <Typography variant="body2">
                        Branch:{' '}
                        {String(values.bank_branch || '—')}
                      </Typography>

                      <Typography variant="body2">
                        Account No.:{' '}
                        {String(
                          values.bank_account_no || '—',
                        )}
                      </Typography>

                      <Typography variant="body2">
                        IFSC:{' '}
                        {String(values.bank_ifsc || '—')}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <Stack
                        spacing={1}
                        sx={{
                          minHeight: 100,
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography
                          sx={{ fontWeight: 700 }}
                        >
                          For{' '}
                          {String(
                            values.company_name ||
                              'Company',
                          )}
                        </Typography>

                        <Typography sx={{ pt: 5 }}>
                          {String(
                            values.authorised_signatory ||
                              'Authorised Signatory',
                          )}
                        </Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                </Paper>
              </>
            )}

            <Stack direction="row" spacing={1}>
              <Button
                disabled={saving}
                type="submit"
                variant="contained"
              >
                {saving
                  ? 'Saving…'
                  : editingId
                    ? `Update ${definition.title}`
                    : `Save ${definition.title}`}
              </Button>

              {editingId !== undefined && (
                <Button
                  onClick={reset}
                  variant="outlined"
                >
                  Cancel edit
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography
            gutterBottom
            variant="h6"
          >
            {definition.title} records
          </Typography>

          {loading ? (
            <Typography>Loading records…</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Number</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell align="right">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {recordLabel(definition, record)}
                      </TableCell>

                      <TableCell>
                        {String(
                          record.quotation_date ??
                            record.proforma_invoice_date ??
                            record.invoice_date ??
                            '',
                        ).slice(0, 10)}
                      </TableCell>

                      <TableCell>
                        {String(
                          record.vendor_name ??
                            record.buyer_customer_name ??
                            record.customer_id ??
                            '',
                        )}
                      </TableCell>

                      <TableCell>
                        {String(
                          record.grand_total ??
                            record.total ??
                            '',
                        )}
                      </TableCell>

                      <TableCell align="right">
                        <IconButton
                          aria-label={`Edit ${recordLabel(
                            definition,
                            record,
                          )}`}
                          onClick={() =>
                            void selectRecord(record)
                          }
                        >
                          <Typography variant="body2">
                            Edit
                          </Typography>
                        </IconButton>

                        <IconButton
                          aria-label={`Delete ${recordLabel(
                            definition,
                            record,
                          )}`}
                          color="error"
                          onClick={() =>
                            record.id !== undefined &&
                            void remove(record.id)
                          }
                        >
                          <Typography variant="body2">
                            Delete
                          </Typography>
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}

                  {records.length === 0 && !error && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        No records found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <ARExcelUpload
          document={definition}
          fields={definition.fields}
          itemFields={definition.itemFields}
          onUploaded={reload}
          resource={definition.endpoint}
          title={definition.title}
        />
      </Stack>
    </ARPageLayout>
  )
}