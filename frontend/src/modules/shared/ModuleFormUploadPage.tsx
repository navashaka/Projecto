import { useState } from 'react'
import * as XLSX from 'xlsx'
import {
  createHRFormRecord,
  submitUserEnquiry
} from '../../actions/dbActions'
import {
  createBankRecord,
  deleteBankRecord,
  getBankRecords,
  type BankResource
} from '../bank/api'
import {
  createModuleFormRecord,
  getModuleFormResource
} from '../moduleFormsApi'
import { createGLTransaction, type GLTransactionResource } from '../gl/glTransactionsApi'
import {
  createProduction,
  createProductionEntry,
  getProductions
} from '../production/api'
import { createProfile } from '../profile/api'
import {
  createPurchaseRecord,
  type PurchaseFormType
} from '../purchase/api'
import { moduleFormTitles, moduleTemplateFiles } from '../moduleFormCatalog'
import type { ModuleId, ModulePageSelection } from '../types'
import ModulePageFrame from './ModulePageFrame'

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

type SheetTemplate = {
  headers: string[]
}

const sheetNameFor = (title: string) =>
  title.replace(/[\\/?*[\]:]/g, '-').slice(0, 31).trim()

const readTemplate = async (
  module: ModuleId,
  title: string
): Promise<SheetTemplate> => {
  const response = await fetch(moduleTemplateFiles[module])
  if (!response.ok) {
    throw new Error(`Unable to load the ${module} template for validation.`)
  }

  const workbook = XLSX.read(await response.arrayBuffer(), { type: 'array' })
  const worksheet = workbook.Sheets[sheetNameFor(title)]
  if (!worksheet) {
    throw new Error(`The module template does not contain a "${title}" sheet.`)
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    range: 1,
    defval: '',
    raw: false
  })
  const headers = (rows[1] ?? []).map(String)
  if (!headers.length || headers.some((header) => !header)) {
    throw new Error(`The "${title}" template sheet is missing its field-name row.`)
  }
  return { headers }
}

const rowToPayload = (headers: string[], cells: unknown[]) =>
  Object.fromEntries(
    headers.map((header, index) => {
      const value = cells[index]
      return [
        header,
        value instanceof Date
          ? value.toISOString().slice(0, 10)
          : value === null || value === undefined
            ? ''
            : String(value).trim()
      ]
    })
  )

const numberValue = (payload: Record<string, string>, name: string) => {
  const value = payload[name]
  if (!value) return 0
  const number = Number(value)
  if (!Number.isFinite(number)) throw new Error(`${name} must be a valid number.`)
  return number
}

const requiredNumber = (payload: Record<string, string>, name: string) => {
  if (!payload[name]) throw new Error(`${name} is required.`)
  return numberValue(payload, name)
}

const parseJsonArray = (payload: Record<string, string>, name: string) => {
  let value: unknown
  try {
    value = JSON.parse(payload[name] || '[]')
  } catch {
    throw new Error(`${name} must contain a valid JSON array.`)
  }
  if (
    !Array.isArray(value) ||
    value.some((item) => typeof item !== 'object' || item === null || Array.isArray(item))
  ) {
    throw new Error(`${name} must contain a JSON array of objects.`)
  }
  return value as Record<string, unknown>[]
}

const amountInWords = (value: number) => {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight',
    'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
    'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ]
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
  for (const [unit, label] of [[10000000, 'Crore'], [100000, 'Lakh'], [1000, 'Thousand'], [1, '']] as const) {
    if (remainder >= unit) {
      const count = Math.floor(remainder / unit)
      parts.push(`${belowThousand(count)}${label ? ` ${label}` : ''}`)
      remainder %= unit
    }
  }
  const paise = Math.round((value - whole) * 100)
  return `${parts.join(' ')} Rupees${paise ? ` and ${belowThousand(paise)} Paise` : ''} Only`
}

const createBankPayload = async (
  page: string,
  resource: BankResource,
  payload: Record<string, string>
) => {
  const passbookPages = new Set(['bank-receipt', 'bank-payment'])
  const isPassbookReference = passbookPages.has(page)
  const bankNameValue = payload.bankPassbook ?? payload.bankPassbookId ?? ''
  let bankName = bankNameValue
  let passbookId: number | undefined

  if (isPassbookReference && bankNameValue) {
    const passbooks = await getBankRecords('passbooks')
    const passbook = passbooks.find(
      (record) =>
        String(record.id) === bankNameValue ||
        String(record.bank_name ?? '') === bankNameValue
    )
    if (!passbook) {
      throw new Error(`Bank passbook "${bankNameValue}" was not found.`)
    }
    passbookId = Number(passbook.id)
    bankName = String(passbook.bank_name ?? '')
  }

  const fields: Record<string, string> = {
    'bank-passbook': 'bank_name',
    'bank-book': 'bank_name',
    'bank-reconciliation': 'bank_name',
    'bank-receipt': 'bank_name',
    'bank-payment': 'bank_name',
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
    'payerGLAccount', 'recipientGLAccount', 'billReference',
    ...(page === 'bank-receipt' ? ['creditAmount'] : []),
    ...(page === 'bank-payment' ? ['debitAmount'] : [])
  ])
  const body: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(payload)) {
    if (excluded.has(key) || !value) continue
    const apiKey = fields[key] ?? key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
    if (key === 'bankPassbook' || key === 'bankPassbookId') {
      body.bank_name = bankName
      if (passbookId !== undefined) body.bank_passbook_id = passbookId
    } else if (key === 'reconciled') {
      body[apiKey] = value.toLowerCase() === 'true' || value.toLowerCase() === 'yes'
    } else if (/amount|balance/.test(apiKey)) {
      body[apiKey] = numberValue(payload, key)
    } else {
      body[apiKey] = value
    }
  }

  if (resource === 'receipts' || resource === 'payments') {
    const saved = await createBankRecord(resource, body)
    const itemResource: BankResource = resource === 'receipts' ? 'receipt-items' : 'payment-items'
    const itemPayload = resource === 'receipts'
      ? {
          receipt_id: saved.id,
          payer_gl_account: payload.payerGLAccount,
          bill_reference: payload.billReference || null,
          credit_amount: numberValue(payload, 'creditAmount')
        }
      : {
          payment_id: saved.id,
          recipient_gl_account: payload.recipientGLAccount,
          bill_reference: payload.billReference || null,
          debit_amount: numberValue(payload, 'debitAmount')
        }
    try {
      await createBankRecord(itemResource, itemPayload)
    } catch (error) {
      try {
        await deleteBankRecord(resource, Number(saved.id))
      } catch {
        throw new Error(
          `Unable to create the ${resource} item, and its incomplete parent record could not be removed.`
        )
      }
      throw error
    }
    return
  }
  await createBankRecord(resource, body)
}

const createRow = async (
  module: ModuleId,
  page: string,
  title: string,
  payload: Record<string, string>
) => {
  if (module === 'hr') {
    if (page === 'candidate-enquiry') {
      await submitUserEnquiry(payload)
      return
    }
    const formType = hrFormTypes[page]
    if (!formType) throw new Error(`Excel import is not configured for ${title}.`)
    await createHRFormRecord(formType, payload)
    return
  }

  if (module === 'purchase') {
    const formType = purchaseFormTypes[page]
    if (!formType) throw new Error(`Excel import is not configured for ${title}.`)
    await createPurchaseRecord(formType, payload)
    return
  }

  if (module === 'bank') {
    const resource = bankResources[page]
    if (!resource) throw new Error(`Excel import is not configured for ${title}.`)
    await createBankPayload(page, resource, payload)
    return
  }

  if (module === 'profile') {
    const profilePayload = Object.fromEntries(
      Object.entries(payload)
        .filter(([, value]) => value !== '')
        .map(([key, value]) => [
          key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
          value
        ])
    )
    await createProfile(profilePayload)
    return
  }

  if (module === 'production') {
    if (page === 'production-output-product') {
      const requiredFields = [
        'outputProductName', 'uom', 'hsn', 'costElement',
        'inputItem1', 'inputItem2', 'inputItem3'
      ]
      const missingField = requiredFields.find((key) => !payload[key])
      if (missingField) throw new Error(`${missingField} is required.`)
      const inputItems = ['inputItem1', 'inputItem2', 'inputItem3']
        .map((key) => payload[key]?.trim())
        .filter((value): value is string => Boolean(value))
        .map((input_item_name) => ({ input_item_name }))
      await createProduction({
        output_product_name: payload.outputProductName,
        uom: payload.uom || null,
        hsn: payload.hsn || null,
        cost_element: payload.costElement || null,
        input_items: inputItems
      })
      return
    }
    if (page === 'production-entry') {
      if (!payload.productionDate || !payload.productionProduct) {
        throw new Error('Production date and output product are required.')
      }
      const products = await getProductions()
      const selected = products.find(
        (product) => product.output_product_name === payload.productionProduct
      )
      if (!selected) {
        throw new Error(`Output product "${payload.productionProduct}" was not found.`)
      }
      const quantity = requiredNumber(payload, 'inputItemQtyConsumed')
      const inputItem = selected.input_items[0]?.input_item_name
      if (quantity > 0 && !inputItem) {
        throw new Error('The selected output product has no input item to consume.')
      }
      await createProductionEntry({
        production_id: selected.id,
        production_date: payload.productionDate,
        shift_a: requiredNumber(payload, 'shiftA'),
        shift_b: requiredNumber(payload, 'shiftB'),
        shift_c: requiredNumber(payload, 'shiftC'),
        consumption: quantity > 0 && inputItem
          ? [{ input_item_name: inputItem, qty_consumed: quantity }]
          : []
      })
      return
    }
  }

  if (module === 'gl' && glTransactionResources[page]) {
    const resource = glTransactionResources[page]
    if (page === 'contra-entry') {
      const debit = numberValue(payload, 'debitAmount')
      const credit = numberValue(payload, 'creditAmount')
      if (!payload.bankCashAccount1 || !payload.bankCashAccount2 ||
        payload.bankCashAccount1 === payload.bankCashAccount2 ||
        debit <= 0 || debit !== credit) {
        throw new Error('Contra accounts must differ and debit/credit amounts must be equal and greater than zero.')
      }
      await createGLTransaction(resource, {
        bank_cash_account_1: payload.bankCashAccount1,
        bank_cash_account_2: payload.bankCashAccount2,
        debit_amount: debit,
        credit_amount: credit,
        total: debit
      })
      return
    }

    if (page === 'journal') {
      const items = parseJsonArray(payload, 'items').map((item) => ({
        gl_account: String(item.gl_account ?? ''),
        debit_amount: Number(item.debit_amount ?? 0),
        credit_amount: Number(item.credit_amount ?? 0),
        cost_element: item.cost_element ? String(item.cost_element) : null
      }))
      const debit = items.reduce((total, item) => total + item.debit_amount, 0)
      const credit = items.reduce((total, item) => total + item.credit_amount, 0)
      if (items.length < 2 || debit <= 0 || debit !== credit) {
        throw new Error('Journal lines must balance and have a positive total.')
      }
      await createGLTransaction(resource, { date: payload.date, total: debit, items })
      return
    }

    const isCredit = page === 'credit-note'
    const amountKey = isCredit ? 'creditnoteNumber' : 'debitnoteNumber'
    const inventoryRelated = payload.inventoryRelated.toLowerCase() === 'true'
    const items = inventoryRelated ? parseJsonArray(payload, 'items') : []
    const accounts = inventoryRelated ? [] : parseJsonArray(payload, 'accounts')
    const total = [...items, ...accounts].reduce((sum, item) =>
      sum + Number(item.total_amount ?? (Number(item.amount ?? 0) + Number(item.gst ?? 0))), 0)
    if (!Number.isFinite(total) || total <= 0) {
      throw new Error('The note must contain lines with a total greater than zero.')
    }
    await createGLTransaction(resource, {
      [isCredit ? 'credit_note_number' : 'debit_note_number']: payload[amountKey],
      date: payload.date,
      party_name: payload.partyName,
      inventory_related: inventoryRelated,
      total,
      rupees_in_words: amountInWords(total),
      items,
      accounts
    })
    return
  }

  const titleMap = moduleFormTitles[module]
  const resourceName = getModuleFormResource(module, titleMap[page])
  if (!resourceName) throw new Error(`Excel import is not configured for ${title}.`)
  await createModuleFormRecord(module, resourceName, payload)
}

type ModuleFormUploadPageProps = {
  selection: ModulePageSelection
  onCancel: () => void
}

const ModuleFormUploadPage = ({
  selection,
  onCancel
}: ModuleFormUploadPageProps) => {
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState('')

  const module = selection.module
  const page = selection.page
  const file = selection.uploadFile
  const title = moduleFormTitles[module][page]

  const importFile = async () => {
    if (!file || !title) return
    setError('')
    setResult('')
    setProgress('')
    setIsImporting(true)

    try {
      if (file.size > 20 * 1024 * 1024) {
        throw new Error('Excel file must be 20 MB or smaller.')
      }
      if (!/\.(xlsx|xlsm|xls)$/i.test(file.name)) {
        throw new Error('Choose an Excel workbook (.xlsx, .xlsm, or .xls).')
      }

      const [template, workbook] = await Promise.all([
        readTemplate(module, title),
        file.arrayBuffer().then((buffer) =>
          XLSX.read(buffer, { type: 'array', cellDates: true })
        )
      ])
      const uploadedSheetName = workbook.SheetNames.find(
        (name) => name === sheetNameFor(title)
      )
      if (!uploadedSheetName) {
        throw new Error(`The workbook needs a "${sheetNameFor(title)}" worksheet.`)
      }

      const worksheet = workbook.Sheets[uploadedSheetName]
      const workbookRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
        header: 1,
        defval: '',
        raw: false,
        dateNF: 'yyyy-mm-dd'
      })
      const headerRowIndex = workbookRows.findIndex((row) =>
        template.headers.every(
          (header, index) => String(row[index] ?? '').trim() === header
        )
      )
      if (headerRowIndex < 0) {
        throw new Error(
          `The "${title}" worksheet field names do not match the downloaded module template.`
        )
      }

      const rows = workbookRows
        .slice(headerRowIndex + 1)
        .map((cells) => rowToPayload(template.headers, cells))
        .filter((row) => Object.values(row).some(Boolean))
      if (!rows.length) throw new Error('The worksheet has no data rows to import.')
      if (rows.length > 500) throw new Error('Upload up to 500 records at a time.')

      const failures: string[] = []
      let imported = 0
      for (let index = 0; index < rows.length; index += 1) {
        setProgress(`Importing ${index + 1} of ${rows.length}…`)
        try {
          await createRow(module, page, title, rows[index])
          imported += 1
        } catch (rowError) {
          failures.push(
            `Row ${headerRowIndex + index + 2}: ${
              rowError instanceof Error ? rowError.message : 'Import failed.'
            }`
          )
        }
      }

      setProgress('')
      setResult(
        failures.length
          ? `Imported ${imported} of ${rows.length} records. Failed rows: ${failures.join(' | ')}`
          : `Successfully imported ${imported} records.`
      )
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : `Unable to import ${title} records.`
      )
      setProgress('')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <ModulePageFrame module={module} page={`${title ?? 'Form'} — Upload`}>
      <div className="mb-3 rounded border border-info-subtle bg-info-subtle p-3">
        Upload the completed <strong>{sheetNameFor(title ?? '')}</strong> worksheet
        from the standardized {module} workbook. Records are submitted through the
        selected form’s API.
      </div>
      <p className="mb-3 text-muted">
        Selected file: <strong>{file?.name ?? 'No file selected'}</strong>
      </p>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {result && <div className="alert alert-info" role="status">{result}</div>}
      {progress && <p role="status">{progress}</p>}
      <button
        type="button"
        className="btn btn-primary"
        disabled={!file || isImporting}
        onClick={() => void importFile()}
      >
        {isImporting ? 'Importing…' : `Import ${title ?? 'Form'} records`}
      </button>
      <button type="button" className="btn btn-outline-secondary ms-2" onClick={onCancel}>
        Cancel
      </button>
    </ModulePageFrame>
  )
}

export default ModuleFormUploadPage
