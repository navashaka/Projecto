import {
  Alert,
  Button,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { formatARError, saveARRecord } from '../services/arApi'
import type { ARDocumentDefinition, ARFieldDefinition } from '../types/arTypes'
import { normalizeARValue, validateARValue } from '../utils/arValidation'

type ExcelCell = string | number | boolean
type ExcelRecord = Record<string, ExcelCell | null>
type MessageType = 'error' | 'info' | 'success'

interface ARExcelUploadProps {
  resource: string
  title: string
  fields: ARFieldDefinition[]
  itemFields?: ARFieldDefinition[]
  document?: ARDocumentDefinition
  customer?: boolean
  onUploaded: () => Promise<unknown>
}

interface PreparedRecord {
  values: Record<string, unknown>
  preview: ExcelRecord
  firstRow: number
}

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
}

function parseDate(value: unknown, field: ARFieldDefinition): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
  }
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value)
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`
    }
  }
  const text = String(value ?? '').trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return text
    }
  }
  throw new Error(`${field.name} must be a valid date in YYYY-MM-DD format.`)
}

function parseCell(
  value: unknown,
  field: ARFieldDefinition,
  rowNumber: number,
): ExcelCell | null {
  if (value === undefined || value === null || value === '') {
    if (field.required) {
      throw new Error(`Row ${rowNumber}: ${field.name} is required.`)
    }
    return null
  }

  if (field.kind === 'boolean') {
    if (typeof value === 'boolean') return value
    const normalized = String(value).trim().toLowerCase()
    if (['true', 'yes', '1'].includes(normalized)) return true
    if (['false', 'no', '0'].includes(normalized)) return false
    throw new Error(
      `Row ${rowNumber}: ${field.name} must be TRUE/FALSE, YES/NO, or 1/0.`,
    )
  }

  if (field.kind === 'date') {
    try {
      return parseDate(value, field)
    } catch (error) {
      throw new Error(
        `Row ${rowNumber}: ${error instanceof Error ? error.message : 'Invalid date.'}`,
      )
    }
  }

  if (field.kind === 'datetime-local') {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}T${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
    }
    const text = String(value).trim().replace(' ', 'T')
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(text)) {
      return text.slice(0, 16)
    }
    throw new Error(
      `Row ${rowNumber}: ${field.name} must use YYYY-MM-DD HH:mm format.`,
    )
  }

  const validationError = validateARValue(field.name, value)
  if (validationError) {
    throw new Error(`Row ${rowNumber}: ${validationError}`)
  }

  if (field.name === 'activity') {
    const activityValue = String(value).trim()
    if (!activityValue) return null
    const activities: Record<string, string> = {
      trader: 'Trader',
      trading: 'Trader',
      'service provider': 'Service Provider',
      manufacturer: 'Manufacturer',
      manufacturing: 'Manufacturer',
    }
    const activity = activities[activityValue.toLowerCase()]
    if (!activity) {
      throw new Error(
        `Row ${rowNumber}: activity must be Trader/Trading, Service Provider, or Manufacturer/Manufacturing.`,
      )
    }
    return activity
  }

  if (field.kind === 'number' || field.kind === 'customer' ||
    field.kind === 'quotation' || field.kind === 'proforma-invoice') {
    const number = Number(value)
    if (!Number.isFinite(number)) {
      throw new Error(`Row ${rowNumber}: ${field.name} must be a valid number.`)
    }
    if (field.step === 1 && !Number.isInteger(number)) {
      throw new Error(`Row ${rowNumber}: ${field.name} must be a whole number.`)
    }
    return number
  }

  return normalizeARValue(field.name, String(value)).trim()
}

function normalizedCell(
  cells: unknown[],
  headers: string[],
  name: string,
): unknown {
  const index = headers.indexOf(name)
  return index < 0 ? '' : cells[index]
}

function readExcelRows(
  matrix: unknown[][],
  props: ARExcelUploadProps,
): { records: PreparedRecord[]; columns: string[] } {
  const [headerRow, ...rows] = matrix
  if (!headerRow) throw new Error('The selected worksheet has no data.')
  const headers = headerRow.map(normalizeHeader)
  while (headers.length > 0 && !headers[headers.length - 1]) headers.pop()
  if (headers.length === 0 || headers.some((header) => !header)) {
    throw new Error('Every Excel column must have a column header.')
  }
  if (new Set(headers).size !== headers.length) {
    throw new Error('The Excel file contains duplicate column headers.')
  }

  const allowedHeaders = new Set(props.fields.map((field) => field.name))
  if (props.document) {
    for (const field of props.itemFields ?? []) {
      allowedHeaders.add(`item_${field.name}`)
    }
  }
  if (props.customer) {
    allowedHeaders.add('account_no')
    allowedHeaders.add('ifsc')
    for (let index = 1; index <= 20; index += 1) {
      allowedHeaders.add(`bank_account_no_${index}`)
      allowedHeaders.add(`bank_ifsc_${index}`)
    }
  }
  const unsupported = headers.filter((header) => !allowedHeaders.has(header))
  if (unsupported.length) {
    throw new Error(`Unsupported Excel columns: ${unsupported.join(', ')}.`)
  }

  const requiredFields = props.fields.filter((field) => field.required)
  const missingHeaders = requiredFields
    .filter((field) => !headers.includes(field.name))
    .map((field) => field.name)
  if (props.document) {
    for (const field of props.itemFields ?? []) {
      if (field.required && !headers.includes(`item_${field.name}`)) {
        missingHeaders.push(`item_${field.name}`)
      }
    }
  }
  if (missingHeaders.length) {
    throw new Error(
      `Missing required Excel columns: ${missingHeaders.join(', ')}.`,
    )
  }

  const grouped = new Map<string, PreparedRecord>()
  for (const [index, cells] of rows.entries()) {
    if (cells.every((cell) => cell === '' || cell === null || cell === undefined)) {
      continue
    }
    if (
      cells.slice(headers.length).some(
        (cell) => cell !== '' && cell !== null && cell !== undefined,
      )
    ) {
      throw new Error(`Row ${index + 2}: a value has no matching column header.`)
    }

    const rowNumber = index + 2
    const values: Record<string, unknown> = {}
    for (const field of props.fields) {
      const value = normalizedCell(cells, headers, field.name)
      const parsed = parseCell(value, field, rowNumber)
      if (parsed !== null) values[field.name] = parsed
    }

    const preview: ExcelRecord = {}
    for (const field of props.fields) {
      preview[field.name] = (values[field.name] as ExcelCell | undefined) ?? ''
    }
    let groupingKey = JSON.stringify(values)

    if (props.document) {
      const item: Record<string, unknown> = {}
      for (const field of props.itemFields ?? []) {
        const parsed = parseCell(
          normalizedCell(cells, headers, `item_${field.name}`),
          field,
          rowNumber,
        )
        if (parsed !== null) item[field.name] = parsed
      }
      const descriptionField =
        props.document.itemKind === 'quotation'
          ? 'product_item_description'
          : 'description'
      if (!String(item[descriptionField] ?? '').trim()) {
        throw new Error(
          `Row ${rowNumber}: ${descriptionField} is required.`,
        )
      }
      const quantity = Number(item.quantity ?? 0)
      const rate = Number(item.rate ?? 0)
      if (props.document.itemKind === 'quotation') {
        item.amount = Math.round((quantity * rate + Number.EPSILON) * 100) / 100
      } else {
        item.value = Math.round((quantity * rate + Number.EPSILON) * 100) / 100
        item.tax =
          Math.round(
            (Number(item.value) * Number(item.gst_rate ?? 0) / 100 +
              Number.EPSILON) *
              100,
          ) / 100
        item.total_amount =
          Math.round((Number(item.value) + Number(item.tax)) * 100) / 100
      }

      const totalsKey = `ar-excel:${props.resource}:${groupingKey}`
      let prepared = grouped.get(totalsKey)
      if (!prepared) {
        prepared = {
          values: { ...values, items: [] },
          preview,
          firstRow: rowNumber,
        }
        grouped.set(totalsKey, prepared)
      }
      const preparedItems = prepared.values.items as Record<string, unknown>[]
      preparedItems.push(item)
      preview[`item_${descriptionField}`] = String(item[descriptionField] ?? '')
      preview.item_quantity = Number(item.quantity ?? 0)
      preview.item_rate = Number(item.rate ?? 0)
      if (props.document.itemKind === 'quotation') {
        preview.item_amount = Number(item.amount ?? 0)
      } else {
        preview.item_value = Number(item.value ?? 0)
        preview.item_tax = Number(item.tax ?? 0)
        preview.item_total_amount = Number(item.total_amount ?? 0)
      }
      continue
    }

    if (props.customer) {
      const accounts: { account_no: string; ifsc: string }[] = []
      const accountNumbers = [
        'account_no',
        ...Array.from({ length: 20 }, (_, accountIndex) =>
          `bank_account_no_${accountIndex + 1}`,
        ),
      ]
      for (const accountHeader of accountNumbers) {
        const accountNo = String(
          normalizedCell(cells, headers, accountHeader) ?? '',
        ).trim()
        const index = accountHeader === 'account_no'
          ? ''
          : accountHeader.slice('bank_account_no'.length)
        const ifscHeader = accountHeader === 'account_no'
          ? 'ifsc'
          : `bank_ifsc${index}`
        const ifsc = String(
          normalizedCell(cells, headers, ifscHeader) ?? '',
        ).trim()
        if (accountNo || ifsc) {
          if (!accountNo || !ifsc) {
            throw new Error(
              `Row ${rowNumber}: provide both ${accountHeader} and ${ifscHeader}.`,
            )
          }
          for (const [fieldName, fieldValue] of [
            [accountHeader, accountNo],
            [ifscHeader, ifsc],
          ]) {
            const validationError = validateARValue(fieldName, fieldValue)
            if (validationError) {
              throw new Error(`Row ${rowNumber}: ${validationError}`)
            }
          }
          accounts.push({
            account_no: normalizeARValue(accountHeader, accountNo),
            ifsc: normalizeARValue(ifscHeader, ifsc),
          })
        }
      }

      groupingKey = JSON.stringify(values)
      const customerKey = `ar-excel:customers:${groupingKey}`
      const existing = grouped.get(customerKey)
      if (existing) {
        const existingAccounts = existing.values.bank_accounts as typeof accounts
        for (const account of accounts) {
          if (
            !existingAccounts.some(
              (existingAccount) =>
                existingAccount.account_no === account.account_no &&
                existingAccount.ifsc === account.ifsc,
            )
          ) {
            existingAccounts.push(account)
          }
        }
      } else {
        grouped.set(customerKey, {
          values: { ...values, bank_accounts: accounts },
          preview,
          firstRow: rowNumber,
        })
      }
      continue
    }

    grouped.set(`ar-excel:${props.resource}:${groupingKey}`, {
      values,
      preview,
      firstRow: rowNumber,
    })
  }

  const records = Array.from(grouped.values())
  if (props.document) {
    for (const record of records) {
      const items = record.values.items as Record<string, unknown>[]
      const total = items.reduce(
        (sum, item) =>
          sum +
          Number(
            props.document?.itemKind === 'quotation'
              ? item.amount ?? 0
              : item.value ?? 0,
          ),
        0,
      )
      const gst = items.reduce((sum, item) => sum + Number(item.tax ?? 0), 0)
      const grandTotal =
        props.document.itemKind === 'quotation'
          ? total + Number(record.values.gst ?? 0)
          : items.reduce((sum, item) => sum + Number(item.total_amount ?? 0), 0)
      if (props.fields.some((field) => field.name === 'total')) {
        record.values.total =
          props.resource === 'tax-invoices' ? grandTotal : total
        record.preview.total = Number(record.values.total)
      }
      if (props.fields.some((field) => field.name === 'gst')) {
        record.values.gst = gst
        record.preview.gst = gst
      }
      if (props.fields.some((field) => field.name === 'grand_total')) {
        record.values.grand_total = grandTotal
        record.preview.grand_total = grandTotal
      }
    }
  }
  if (!records.length) throw new Error('The selected worksheet has no data rows.')
  return { records, columns: headers }
}

export default function ARExcelUpload(props: ARExcelUploadProps) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [columns, setColumns] = useState<string[]>([])
  const [records, setRecords] = useState<PreparedRecord[]>([])
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<MessageType>('info')
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file?: File) => {
    setFileName('')
    setColumns([])
    setRecords([])
    setMessage('')
    if (!file) return

    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!['xlsx', 'xls'].includes(extension ?? '')) {
      setMessageType('error')
      setMessage('Excel files only: please choose .xlsx or .xls.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessageType('error')
      setMessage('File is too large. Maximum size is 10 MB.')
      return
    }

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), {
        type: 'array',
        cellDates: true,
      })
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) throw new Error('The Excel file has no worksheet.')
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(
        workbook.Sheets[sheetName],
        { header: 1, defval: '', raw: true, blankrows: false },
      )
      const parsed = readExcelRows(matrix, props)
      setFileName(file.name)
      setColumns(parsed.columns)
      setRecords(parsed.records)
      setMessageType('info')
      setMessage(
        `${parsed.records.length} ${props.title.toLowerCase()} record(s) ready to preview.`,
      )
    } catch (error) {
      setMessageType('error')
      setMessage(formatARError(error, 'Unable to read the Excel file.'))
    }
  }

  const saveRows = async () => {
    if (!fileName || records.length === 0) {
      setMessageType('error')
      setMessage('Choose a valid Excel file first.')
      return
    }

    setUploading(true)
    setMessage('')
    let savedCount = 0
    try {
      for (const record of records) {
        await saveARRecord(props.resource, record.values)
        savedCount += 1
      }
      await props.onUploaded()
      setRecords([])
      setColumns([])
      setFileName('')
      if (fileInput.current) fileInput.current.value = ''
      setMessageType('success')
      setMessage(`${savedCount} ${props.title.toLowerCase()} record(s) saved successfully.`)
    } catch (error) {
      try {
        await props.onUploaded()
      } catch (reloadError) {
        setMessageType('error')
        setMessage(
          `${savedCount} of ${records.length} records were saved. ${formatARError(error, 'Upload failed.')}; refresh failed: ${formatARError(reloadError, 'Unable to reload records.')}`,
        )
        setUploading(false)
        return
      }
      setMessageType('error')
      setMessage(
        `${savedCount} of ${records.length} records were saved. ${formatARError(error, 'Upload failed.')}`,
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <Paper component="section" sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={2}>
        <Typography variant="h5">Upload Data</Typography>
        {message && messageType !== 'success' && (
          <Alert severity={messageType}>{message}</Alert>
        )}
        <Snackbar
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          autoHideDuration={5000}
          onClose={() => {
            if (messageType === 'success') setMessage('')
          }}
          open={Boolean(message) && messageType === 'success'}
        >
          <Alert
            onClose={() => setMessage('')}
            severity="success"
            variant="filled"
          >
            {message}
          </Alert>
        </Snackbar>
        <div>
          <Typography component="label" htmlFor={`ar-excel-${props.resource}`} variant="body2">
            Select Excel file
          </Typography>
          <input
            accept=".xlsx,.xls"
            disabled={uploading}
            id={`ar-excel-${props.resource}`}
            onChange={(event) => {
              void handleFile(event.target.files?.[0])
              event.target.value = ''
            }}
            ref={fileInput}
            style={{ display: 'block', marginTop: 8 }}
            type="file"
          />
        </div>
        {fileName && (
          <Typography variant="body2">
            Selected: <strong>{fileName}</strong>
          </Typography>
        )}
        {records.length > 0 && (
          <>
            <Typography variant="h6">Excel Preview</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {columns.map((column) => (
                      <TableCell key={column}>{column}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.slice(0, 10).map((record, index) => (
                    <TableRow key={`${record.firstRow}-${index}`}>
                      {columns.map((column) => (
                        <TableCell key={column}>
                          {String(record.preview[column] ?? '')}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {records.length > 10 && (
              <Typography color="text.secondary" variant="body2">
                Showing first 10 of {records.length} records in preview.
              </Typography>
            )}
            <Button
              disabled={uploading}
              onClick={() => void saveRows()}
              variant="contained"
            >
              {uploading ? 'Uploading...' : 'Save'}
            </Button>
          </>
        )}
      </Stack>
    </Paper>
  )
}
