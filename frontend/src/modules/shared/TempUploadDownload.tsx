import { useState } from 'react'
import * as XLSX from '@e965/xlsx'
import {
  createHRFormRecord,
  getHRFormRecords,
  getUserEnquiries,
  submitUserEnquiry
} from '../../actions/dbActions'
import {
  createBankRecord,
  deleteBankRecord,
  getBankRecords,
  type BankResource
} from '../bank/api'
import {
  createGLTransaction,
  getGLTransactions,
  type GLTransactionResource
} from '../gl/glTransactionsApi'
import {
  createModuleFormRecord,
  getModuleFormRecords,
  getModuleFormResource
} from '../moduleFormsApi'
import {
  createProduction,
  createProductionEntry,
  getProductionEntries,
  getProductions
} from '../production/api'
import { createProfile, getProfiles } from '../profile/api'
import {
  createPurchaseRecord,
  getPurchaseRecords,
  type PurchaseFormType
} from '../purchase/api'
import type { ModuleId } from '../types'
import ModulePageFrame from './ModulePageFrame'
import {
  templateForms,
  templateModuleNames,
  type TemplateForm
} from './templateFormCatalog'

type Props = {
  module: ModuleId
}

type ImportRow = Record<string, string>
type ViewRecord = Record<string, unknown>

const hrFormTypes: Record<string, string> = {
  'bank-enquiry': 'bank-enquiry',
  attendance: 'attendance',
  employees: 'employees',
  'company-holidays': 'company-holidays',
  salary: 'salary',
  designations: 'designations',
  payroll: 'payroll',
  leave: 'leave',
  'on-employment': 'on-employment',
  'travelling-advance': 'travelling-advance'
}

const purchaseFormTypes: Record<string, PurchaseFormType> = {
  vendor: 'vendors',
  'advance-requisition': 'advance-requisitions',
  'quotation-comparison': 'quotation-comparisons',
  'purchase-order': 'orders'
}

const bankResources: Record<string, BankResource> = {
  'bank-passbook': 'passbooks',
  'bank-receipt': 'receipts',
  'bank-payment': 'payments',
  'bank-book': 'books',
  'bank-reconciliation': 'reconciliations'
}

const glTransactionResources: Record<string, GLTransactionResource> = {
  'contra-entry': 'contra-entries',
  journal: 'journal-entries',
  'credit-note': 'credit-notes',
  'debit-note': 'debit-notes'
}

const viewRecords = async (
  module: ModuleId,
  form: TemplateForm
): Promise<ViewRecord[]> => {
  if (module === 'hr') {
    if (form.id === 'candidate-enquiry') return getUserEnquiries()
    const formType = hrFormTypes[form.id]
    if (!formType) throw new Error(`Viewing is not configured for ${form.title}.`)
    return getHRFormRecords(formType)
  }

  if (module === 'purchase') {
    const formType = purchaseFormTypes[form.id]
    if (!formType) throw new Error(`Viewing is not configured for ${form.title}.`)
    return getPurchaseRecords(formType)
  }

  if (module === 'bank' && !form.targetResource) {
    const resource = bankResources[form.id]
    if (!resource) throw new Error(`Viewing is not configured for ${form.title}.`)
    const records = await getBankRecords(resource)
    if (resource !== 'receipts' && resource !== 'payments') return records
    const lineResource: BankResource =
      resource === 'receipts' ? 'receipt-items' : 'payment-items'
    const parentKey = resource === 'receipts' ? 'receipt_id' : 'payment_id'
    const lines = await getBankRecords(lineResource)
    return records.map((record) => {
      const line = lines.find((item) => Number(item[parentKey]) === record.id)
      return line ? { ...record, ...line } : record
    })
  }

  if (module === 'gl' && glTransactionResources[form.id]) {
    return getGLTransactions(glTransactionResources[form.id])
  }

  if (module === 'production') {
    const products = await getProductions()
    if (form.id === 'production-output-product') return products
    if (form.id === 'production-entry') {
      const entries = await Promise.all(
        products.map(async (product) =>
          (await getProductionEntries(product.id)).map((entry) => ({
            ...entry,
            productionProduct: product.output_product_name
          }))
        )
      )
      return entries.flat()
    }
    throw new Error(`Viewing is not configured for ${form.title}.`)
  }

  if (module === 'profile') return getProfiles()

  const targetModule = form.targetModule ?? module
  const resource = form.targetResource ?? getModuleFormResource(targetModule, form.title)
  if (!resource) throw new Error(`Viewing is not configured for ${form.title}.`)
  return getModuleFormRecords(targetModule, resource)
}

const toRecord = (value: unknown): ViewRecord => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const record = value as ViewRecord
  const payload = record.payload
  return payload && typeof payload === 'object' && !Array.isArray(payload)
    ? { ...record, ...(payload as ViewRecord) }
    : record
}

const fieldValue = (record: ViewRecord, field: string) => {
  if (field === 'bankPassbookId' && record.bank_name !== undefined) {
    return record.bank_name
  }
  const snakeCase = toSnakeCase(field)
  return record[field] ?? record[snakeCase]
}

const displayValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const fieldLabel = (field: string) =>
  field.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (letter) => letter.toUpperCase())

const worksheetNameFor = (title: string) =>
  title.replace(/[\\/?*[\]:]/g, '-').slice(0, 31).trim()

const cellToString = (value: unknown) =>
  value instanceof Date
    ? value.toISOString().slice(0, 10)
    : value === null || value === undefined
      ? ''
      : String(value).trim()

const numberFrom = (row: ImportRow, field: string) => {
  const value = row[field]?.trim() ?? ''
  if (!value) return 0
  const number = Number(value)
  if (!Number.isFinite(number)) throw new Error(`${field} must be a valid number.`)
  return number
}

const requiredNumber = (row: ImportRow, field: string) => {
  if (!row[field]?.trim()) throw new Error(`${field} is required.`)
  return numberFrom(row, field)
}

const jsonObjectArray = (row: ImportRow, field: string) => {
  let value: unknown
  try {
    value = JSON.parse(row[field] || '[]')
  } catch {
    throw new Error(`${field} must contain a valid JSON array.`)
  }
  if (
    !Array.isArray(value) ||
    value.some((item) => typeof item !== 'object' || item === null || Array.isArray(item))
  ) {
    throw new Error(`${field} must contain a JSON array of objects.`)
  }
  return value as Record<string, unknown>[]
}

const toSnakeCase = (value: string) =>
  value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)

const rupeesInWords = (value: number) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const belowThousand = (number: number) => {
    let result = ''
    if (number >= 100) {
      result += `${ones[Math.floor(number / 100)]} Hundred `
      number %= 100
    }
    if (number >= 20) {
      result += `${tens[Math.floor(number / 10)]} `
      number %= 10
    }
    if (number > 0) result += `${ones[number]} `
    return result.trim()
  }
  const whole = Math.floor(value)
  let remainder = whole
  const parts: string[] = []
  for (const [unit, name] of [[10000000, 'Crore'], [100000, 'Lakh'], [1000, 'Thousand'], [1, '']] as const) {
    if (remainder >= unit) {
      const count = Math.floor(remainder / unit)
      parts.push(`${belowThousand(count)}${name ? ` ${name}` : ''}`)
      remainder %= unit
    }
  }
  const paise = Math.round((value - whole) * 100)
  return `${parts.join(' ')} Rupees${paise ? ` and ${belowThousand(paise)} Paise` : ''} Only`
}

/**
 * Pre-validates the validations already present in the Excel import
 * handlers before any row is submitted.
 */
const validateImportRow = async (
  module: ModuleId,
  form: TemplateForm,
  row: ImportRow
) => {
  if (module === 'gl' && form.id === 'cheque-range') {
    throw new Error(
      'Cheque images cannot be imported from an Excel cell. Create this record from the form and upload its image there.'
    )
  }

  if (module === 'hr') {
    if (form.id === 'candidate-enquiry') {
      if (row.attachDocuments || row.employerDocuments || row.previousEmployerDocuments) {
        throw new Error(
          'Candidate document attachments cannot be embedded in Excel. Import the row without document values, then add files from the Candidate Enquiry form.'
        )
      }
      return
    }

    const formType = hrFormTypes[form.id]
    if (!formType) throw new Error(`Import is not configured for ${form.title}.`)

    if (form.id === 'travelling-advance') {
      jsonObjectArray(row, 'budget_items')
      numberFrom(row, 'other_expense_amount')
    }
    return
  }

  if (module === 'purchase') {
    if (!purchaseFormTypes[form.id]) {
      throw new Error(`Import is not configured for ${form.title}.`)
    }
    return
  }

  if (module === 'bank') {
    if (form.targetResource && form.targetModule) return

    const resource = bankResources[form.id]
    if (!resource) throw new Error(`Import is not configured for ${form.title}.`)

    const isTransaction = resource === 'receipts' || resource === 'payments'

    if (isTransaction) {
      const bankReference = row.bankPassbook ?? row.bankPassbookId ?? ''
      if (!bankReference) throw new Error('Bank passbook is required.')

      const passbooks = await getBankRecords('passbooks')
      const passbook = passbooks.find(
        (record) =>
          String(record.id) === bankReference ||
          String(record.bank_name ?? '') === bankReference
      )

      if (!passbook) {
        throw new Error(`Bank passbook "${bankReference}" was not found.`)
      }

      if (resource === 'receipts') {
        requiredNumber(row, 'creditAmount')
      } else {
        requiredNumber(row, 'debitAmount')
      }
    }

    for (const [key, value] of Object.entries(row)) {
      if (value && /amount|balance/i.test(key)) {
        numberFrom(row, key)
      }
    }
    return
  }

  if (module === 'production' && form.id === 'production-entry') {
    const products = await getProductions()
    const product = products.find(
      (record) => record.output_product_name === row.productionProduct
    )

    if (!product) {
      throw new Error(`Output product "${row.productionProduct}" was not found.`)
    }

    requiredNumber(row, 'shiftA')
    requiredNumber(row, 'shiftB')
    requiredNumber(row, 'shiftC')

    const consumed = numberFrom(row, 'inputItemQtyConsumed')
    if (consumed > 0 && !product.input_items[0]?.input_item_name) {
      throw new Error('The selected output product has no input item to consume.')
    }
    return
  }

  if (module === 'production' && form.id === 'production-output-product') {
    if (!row.outputProductName?.trim()) {
      throw new Error('outputProductName is required.')
    }
    return
  }

  if (module === 'profile') return

  if (module === 'gl' && glTransactionResources[form.id]) {
    if (form.id === 'contra-entry') {
      const debit = requiredNumber(row, 'debitAmount')
      const credit = requiredNumber(row, 'creditAmount')

      if (
        !row.bankCashAccount1 ||
        !row.bankCashAccount2 ||
        row.bankCashAccount1 === row.bankCashAccount2 ||
        debit !== credit
      ) {
        throw new Error('Select different accounts and equal debit/credit amounts.')
      }
      return
    }

    if (form.id === 'journal') {
      const items = jsonObjectArray(row, 'items').map((item) => ({
        gl_account: String(item.gl_account ?? ''),
        debit_amount: Number(item.debit_amount ?? 0),
        credit_amount: Number(item.credit_amount ?? 0)
      }))

      const debit = items.reduce((sum, item) => sum + item.debit_amount, 0)
      const credit = items.reduce((sum, item) => sum + item.credit_amount, 0)

      if (
        items.length < 2 ||
        items.some(
          (item) =>
            !Number.isFinite(item.debit_amount) ||
            !Number.isFinite(item.credit_amount) ||
            item.debit_amount < 0 ||
            item.credit_amount < 0
        ) ||
        debit <= 0 ||
        debit !== credit
      ) {
        throw new Error('Journal lines need a positive, balanced debit and credit total.')
      }
      return
    }

    if (form.id === 'credit-note' || form.id === 'debit-note') {
      const inventoryRelated = ['true', 'yes', '1'].includes(
        (row.inventoryRelated ?? '').toLowerCase()
      )
      const items = inventoryRelated ? jsonObjectArray(row, 'items') : []
      const accounts = inventoryRelated ? [] : jsonObjectArray(row, 'accounts')
      const total = [...items, ...accounts].reduce(
        (sum, item) =>
          sum + Number(
            item.total_amount ?? (Number(item.amount ?? 0) + Number(item.gst ?? 0))
          ),
        0
      )

      if (!Number.isFinite(total) || total <= 0) {
        throw new Error('The note needs detail lines with a total greater than zero.')
      }
      return
    }
  }

  const targetModule = form.targetModule ?? module
  const resource = form.targetResource ?? getModuleFormResource(targetModule, form.title)
  if (!resource) throw new Error(`Import is not configured for ${form.title}.`)
}

const createBankRow = async (form: TemplateForm, row: ImportRow) => {
  if (form.targetResource && form.targetModule) {
    await createModuleFormRecord(form.targetModule, form.targetResource, row)
    return
  }

  const resource = bankResources[form.id]
  if (!resource) throw new Error(`Import is not configured for ${form.title}.`)
  const isTransaction = resource === 'receipts' || resource === 'payments'
  const bankReference = row.bankPassbook ?? row.bankPassbookId ?? ''
  let bankName = bankReference
  let passbookId: number | undefined

  if (isTransaction && bankReference) {
    const passbooks = await getBankRecords('passbooks')
    const passbook = passbooks.find(
      (record) =>
        String(record.id) === bankReference ||
        String(record.bank_name ?? '') === bankReference
    )
    if (!passbook) throw new Error(`Bank passbook "${bankReference}" was not found.`)
    bankName = String(passbook.bank_name ?? '')
    passbookId = Number(passbook.id)
  }

  const keyMap: Record<string, string> = {
    bankPassbook: 'bank_name',
    bankPassbookId: 'bank_name',
    date: 'bank_date',
    bankDate: 'bank_date',
    transactionDate: 'transaction_date',
    referenceNumber: 'reference_number',
    debitAmount: 'debit_amount',
    creditAmount: 'credit_amount',
    balance: 'balance_amount',
    reconciled: 'is_reconciled',
    voucherDate: 'voucher_date',
    voucherNumber: 'voucher_number',
    glAccount: 'gl_account',
    receiptVoucherDate: 'receipt_voucher_date',
    paymentVoucherDate: 'payment_voucher_date',
    totalBankAmount: 'total_bank_amount',
    totalDebitAmount: 'total_debit_amount',
    totalCreditAmount: 'total_credit_amount',
    closingBalanceBankBook: 'closing_balance_bank_book',
    unreconciledFromBank: 'unreconciled_transaction_from_bank',
    unreconciledFromBankBook: 'unreconciled_transaction_from_bank_book',
    closingBalanceBank: 'closing_balance_bank'
  }
  const excluded = new Set([
    'payerGLAccount',
    'recipientGLAccount',
    'billReference',
    ...(resource === 'receipts' ? ['creditAmount'] : []),
    ...(resource === 'payments' ? ['debitAmount'] : [])
  ])
  const payload: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    if (!value || excluded.has(key)) continue
    const apiKey = keyMap[key] ?? toSnakeCase(key)
    if (key === 'bankPassbook' || key === 'bankPassbookId') {
      payload.bank_name = bankName
      if (passbookId !== undefined) payload.bank_passbook_id = passbookId
    } else if (key === 'reconciled') {
      payload[apiKey] = ['true', 'yes', '1'].includes(value.toLowerCase())
    } else if (/amount|balance/.test(apiKey)) {
      payload[apiKey] = numberFrom(row, key)
    } else {
      payload[apiKey] = value
    }
  }

  if (!isTransaction) {
    await createBankRecord(resource, payload)
    return
  }

  const parent = await createBankRecord(resource, payload)
  const itemResource: BankResource = resource === 'receipts' ? 'receipt-items' : 'payment-items'
  const itemPayload = resource === 'receipts'
    ? {
        receipt_id: parent.id,
        payer_gl_account: row.payerGLAccount,
        bill_reference: row.billReference || null,
        credit_amount: requiredNumber(row, 'creditAmount')
      }
    : {
        payment_id: parent.id,
        recipient_gl_account: row.recipientGLAccount,
        bill_reference: row.billReference || null,
        debit_amount: requiredNumber(row, 'debitAmount')
      }
  try {
    await createBankRecord(itemResource, itemPayload)
  } catch (error) {
    try {
      await deleteBankRecord(resource, parent.id)
    } catch {
      throw new Error('The transaction line failed and its incomplete parent record could not be removed.')
    }
    throw error
  }
}

const createRow = async (module: ModuleId, form: TemplateForm, row: ImportRow) => {
  if (module === 'gl' && form.id === 'cheque-range') {
    throw new Error(
      'Cheque images cannot be imported from an Excel cell. Create this record from the form and upload its image there.'
    )
  }

  if (module === 'hr') {
    if (form.id === 'candidate-enquiry') {
      if (row.attachDocuments || row.employerDocuments || row.previousEmployerDocuments) {
        throw new Error(
          'Candidate document attachments cannot be embedded in Excel. Import the row without document values, then add files from the Candidate Enquiry form.'
        )
      }
      await submitUserEnquiry(row)
      return
    }
    const formType = hrFormTypes[form.id]
    if (!formType) throw new Error(`Import is not configured for ${form.title}.`)
    const payload: Record<string, unknown> = { ...row }
    if (form.id === 'travelling-advance') {
      payload.budget_items = jsonObjectArray(row, 'budget_items')
      payload.other_expense_amount = numberFrom(row, 'other_expense_amount')
    }
    await createHRFormRecord(formType, payload)
    return
  }

  if (module === 'purchase') {
    const formType = purchaseFormTypes[form.id]
    if (!formType) throw new Error(`Import is not configured for ${form.title}.`)
    await createPurchaseRecord(formType, row)
    return
  }

  if (module === 'bank') {
    await createBankRow(form, row)
    return
  }

  if (module === 'profile') {
    await createProfile(Object.fromEntries(
      Object.entries(row).map(([key, value]) => [toSnakeCase(key), value || null])
    ))
    return
  }

  if (module === 'production' && form.id === 'production-output-product') {
    const inputItems = ['inputItem1', 'inputItem2', 'inputItem3']
      .map((key) => row[key]?.trim())
      .filter((name): name is string => Boolean(name))
      .map((input_item_name) => ({ input_item_name }))
    await createProduction({
      output_product_name: row.outputProductName,
      uom: row.uom || null,
      hsn: row.hsn || null,
      cost_element: row.costElement || null,
      input_items: inputItems
    })
    return
  }

  if (module === 'production' && form.id === 'production-entry') {
    const product = (await getProductions()).find(
      (record) => record.output_product_name === row.productionProduct
    )
    if (!product) throw new Error(`Output product "${row.productionProduct}" was not found.`)
    const consumed = numberFrom(row, 'inputItemQtyConsumed')
    const inputName = product.input_items[0]?.input_item_name
    if (consumed > 0 && !inputName) {
      throw new Error('The selected output product has no input item to consume.')
    }
    await createProductionEntry({
      production_id: product.id,
      production_date: row.productionDate,
      shift_a: requiredNumber(row, 'shiftA'),
      shift_b: requiredNumber(row, 'shiftB'),
      shift_c: requiredNumber(row, 'shiftC'),
      consumption: consumed > 0 && inputName
        ? [{ input_item_name: inputName, qty_consumed: consumed }]
        : []
    })
    return
  }

  if (module === 'gl' && glTransactionResources[form.id]) {
    const resource = glTransactionResources[form.id]
    if (form.id === 'contra-entry') {
      const debit = requiredNumber(row, 'debitAmount')
      const credit = requiredNumber(row, 'creditAmount')
      if (!row.bankCashAccount1 || !row.bankCashAccount2 ||
        row.bankCashAccount1 === row.bankCashAccount2 || debit !== credit) {
        throw new Error('Select different accounts and equal debit/credit amounts.')
      }
      await createGLTransaction(resource, {
        bank_cash_account_1: row.bankCashAccount1,
        bank_cash_account_2: row.bankCashAccount2,
        debit_amount: debit,
        credit_amount: credit,
        total: debit
      })
      return
    }
    if (form.id === 'journal') {
      const items = jsonObjectArray(row, 'items').map((item) => ({
        gl_account: String(item.gl_account ?? ''),
        debit_amount: Number(item.debit_amount ?? 0),
        credit_amount: Number(item.credit_amount ?? 0),
        cost_element: item.cost_element ? String(item.cost_element) : null
      }))
      const debit = items.reduce((sum, item) => sum + item.debit_amount, 0)
      const credit = items.reduce((sum, item) => sum + item.credit_amount, 0)
      if (items.length < 2 || debit <= 0 || debit !== credit) {
        throw new Error('Journal lines need a positive, balanced debit and credit total.')
      }
      await createGLTransaction(resource, { date: row.date, total: debit, items })
      return
    }

    const creditNote = form.id === 'credit-note'
    const inventoryRelated = ['true', 'yes', '1'].includes((row.inventoryRelated ?? '').toLowerCase())
    const items = inventoryRelated ? jsonObjectArray(row, 'items') : []
    const accounts = inventoryRelated ? [] : jsonObjectArray(row, 'accounts')
    const total = [...items, ...accounts].reduce(
      (sum, item) => sum + Number(
        item.total_amount ?? (Number(item.amount ?? 0) + Number(item.gst ?? 0))
      ),
      0
    )
    if (!Number.isFinite(total) || total <= 0) {
      throw new Error('The note needs detail lines with a total greater than zero.')
    }
    await createGLTransaction(resource, {
      [creditNote ? 'credit_note_number' : 'debit_note_number']:
        row[creditNote ? 'creditNoteNumber' : 'debitNoteNumber'],
      date: row.date,
      party_name: row.partyName,
      inventory_related: inventoryRelated,
      total,
      rupees_in_words: rupeesInWords(total),
      items,
      accounts
    })
    return
  }

  const targetModule = form.targetModule ?? module
  const resource = form.targetResource ?? getModuleFormResource(targetModule, form.title)
  if (!resource) throw new Error(`Import is not configured for ${form.title}.`)
  await createModuleFormRecord(targetModule, resource, row)
}

const downloadTemplate = (module: ModuleId, form: TemplateForm) => {
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet([form.headers])
  XLSX.utils.book_append_sheet(workbook, worksheet, worksheetNameFor(form.title))
  const content = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([content], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${module}-${form.id}-template.xlsx`
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

const TempUploadDownload = ({ module }: Props) => {
  const forms = templateForms[module]
  const [selectedFormId, setSelectedFormId] = useState(forms[0]?.id ?? '')
  const [activeAction, setActiveAction] = useState<'upload' | 'view' | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [records, setRecords] = useState<ViewRecord[]>([])
  const [isLoadingRecords, setIsLoadingRecords] = useState(false)
  const [viewError, setViewError] = useState('')
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState('')

  const selectedForm = forms.find((form) => form.id === selectedFormId)

  const formSelect = (
    id: string,
    value: string,
    onChange: (value: string) => void
  ) => (
    <select
      id={id}
      className="form-select form-select-sm"
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
    >
      {forms.map((form) => (
        <option key={form.id} value={form.id}>{form.title}</option>
      ))}
    </select>
  )

  const importExcel = async () => {
    if (!file || !selectedForm) return
    setError('')
    setResult('')
    setIsImporting(true)
    setProgress('')

    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Excel file must be 10 MB or smaller.')
      }
      if (!/\.(xlsx|xlsm|xls)$/i.test(file.name)) {
        throw new Error('Select an Excel workbook (.xlsx, .xlsm, or .xls).')
      }

      const workbook = XLSX.read(await file.arrayBuffer(), {
        type: 'array',
        cellDates: true
      })
      const sheetName = worksheetNameFor(selectedForm.title)
      const worksheet = workbook.Sheets[sheetName]
      if (!worksheet) throw new Error(`The workbook needs a "${sheetName}" worksheet.`)

      const parsedRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
        header: 1,
        defval: '',
        raw: false,
        dateNF: 'yyyy-mm-dd'
      })
      const headers = parsedRows[0]?.map(cellToString)

      if (
        !headers ||
        headers.length !== selectedForm.headers.length ||
        headers.some((header, index) => header !== selectedForm.headers[index])
      ) {
        throw new Error('Excel columns must match the selected form template exactly.')
      }

      const dataRows = parsedRows.slice(1)
        .map((cells) => Object.fromEntries(
          selectedForm.headers.map((header, index) => [header, cellToString(cells[index])])
        ))
        .filter((row) => Object.values(row).some((value) => value !== ''))

      if (!dataRows.length) throw new Error('The worksheet contains no data rows.')
      if (dataRows.length > 500) throw new Error('Upload up to 500 records at a time.')

      // STEP 1: Validate every row before saving any record.
      const failures: string[] = []

      for (let index = 0; index < dataRows.length; index += 1) {
        setProgress(`Validating row ${index + 1} of ${dataRows.length}…`)

        try {
          await validateImportRow(module, selectedForm, dataRows[index])
        } catch (rowError) {
          failures.push(
            `Row ${index + 2}: ${
              rowError instanceof Error ? rowError.message : 'Validation failed.'
            }`
          )
        }
      }

      // If any row is invalid, stop the import. Nothing is saved.
      if (failures.length > 0) {
        setProgress('')
        setError(
          `Excel validation failed. No records were saved.\n${failures.join('\n')}`
        )
        return
      }

      // STEP 2: Save only when all rows pass validation.
      let imported = 0

      for (let index = 0; index < dataRows.length; index += 1) {
        setProgress(`Importing row ${index + 1} of ${dataRows.length}…`)

        try {
          await createRow(module, selectedForm, dataRows[index])
          imported += 1
        } catch (rowError) {
          setProgress('')
          setError(
            `Saving failed at row ${index + 2}. ${imported} rows were saved before this error. ${
              rowError instanceof Error ? rowError.message : 'Import failed.'
            }`
          )
          return
        }
      }

      setProgress('')
      setResult(`Successfully imported ${imported} rows.`)
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : 'Unable to import this Excel file.'
      )
      setProgress('')
    } finally {
      setIsImporting(false)
    }
  }

  const showRecords = async () => {
    if (!selectedForm) return
    setActiveAction('view')
    setIsLoadingRecords(true)
    setViewError('')
    setRecords([])
    try {
      setRecords((await viewRecords(module, selectedForm)).map(toRecord))
    } catch (loadError) {
      setViewError(
        loadError instanceof Error
          ? loadError.message
          : `Unable to load ${selectedForm.title} records.`
      )
    } finally {
      setIsLoadingRecords(false)
    }
  }

  const selectForm = (value: string) => {
    setSelectedFormId(value)
    setActiveAction(null)
    setFile(null)
    setRecords([])
    setError('')
    setResult('')
    setViewError('')
  }

  return (
    <ModulePageFrame module={module} page={templateModuleNames[module]}>
      {forms.length > 0 ? (
        <div className="rounded border p-2">
          <label className="form-label small mb-1" htmlFor="template-form">Choose a form</label>
          {formSelect('template-form', selectedFormId, selectForm)}
          <div className="d-flex flex-wrap gap-2 mt-2" role="group" aria-label="Form actions">
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              disabled={!selectedForm}
              onClick={() => selectedForm && downloadTemplate(module, selectedForm)}
            >
              Download
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeAction === 'upload' ? 'btn-primary' : 'btn-outline-primary'}`}
              disabled={!selectedForm}
              aria-pressed={activeAction === 'upload'}
              onClick={() => {
                setActiveAction('upload')
                setError('')
                setResult('')
              }}
            >
              Upload
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeAction === 'view' ? 'btn-primary' : 'btn-outline-primary'}`}
              disabled={!selectedForm || isLoadingRecords}
              aria-pressed={activeAction === 'view'}
              onClick={() => void showRecords()}
            >
              {isLoadingRecords ? 'Loading…' : 'View'}
            </button>
          </div>

          {activeAction === 'upload' && selectedForm && (
            <section className="mt-3" aria-labelledby="upload-excel-title">
              <h2 id="upload-excel-title" className="h6 mb-2">Upload Excel</h2>
              <p className="form-text small mb-2">
                Choose the matching Excel template. Each row is submitted to {selectedForm.title}.
              </p>
              <label className="form-label small mb-1" htmlFor="template-excel-file">Excel file</label>
              <input
                id="template-excel-file"
                className="form-control form-control-sm"
                key={selectedFormId}
                type="file"
                accept=".xlsx,.xlsm,.xls"
                onChange={(event) => {
                  setFile(event.currentTarget.files?.[0] ?? null)
                  setError('')
                  setResult('')
                }}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm mt-2"
                disabled={!file || isImporting}
                onClick={() => void importExcel()}
              >
                {isImporting ? 'Importing…' : 'Import Excel'}
              </button>
            </section>
          )}

          {activeAction === 'view' && selectedForm && (
            <section className="mt-3" aria-labelledby="view-records-title">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h2 id="view-records-title" className="h6 mb-0">{selectedForm.title} Records</h2>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  disabled={isLoadingRecords}
                  onClick={() => void showRecords()}
                >
                  Refresh
                </button>
              </div>
              {isLoadingRecords ? (
                <p className="small text-muted mb-0" role="status">Loading records…</p>
              ) : viewError ? (
                <div className="alert alert-danger py-2 small mb-0" role="alert">{viewError}</div>
              ) : records.length === 0 ? (
                <p className="small text-muted mb-0">No records found.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm table-striped table-bordered align-middle mb-0">
                    <thead>
                      <tr>
                        <th scope="col">ID</th>
                        {selectedForm.headers.map((header) => (
                          <th key={header} scope="col">{fieldLabel(header)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record, index) => (
                        <tr key={String(record.id ?? index)}>
                          <td>{displayValue(record.id)}</td>
                          {selectedForm.headers.map((header) => (
                            <td key={header}>{displayValue(fieldValue(record, header))}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      ) : (
        <p className="text-muted">No form templates are configured for this module yet.</p>
      )}

      {error && (
        <div
          className="alert alert-danger mt-3"
          role="alert"
          style={{ whiteSpace: 'pre-line' }}
        >
          {error}
        </div>
      )}
      {result && <div className="alert alert-info mt-3" role="status">{result}</div>}
      {progress && <p className="mt-3" role="status">{progress}</p>}
    </ModulePageFrame>
  )
}

export default TempUploadDownload