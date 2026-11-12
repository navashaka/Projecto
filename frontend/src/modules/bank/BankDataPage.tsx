import { Fragment, useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import ModulePageFrame from '../shared/ModulePageFrame'
import type { ModulePageField } from '../types'
import {
  createBankRecord,
  deleteBankRecord,
  getBankRecord,
  getBankRecords,
  updateBankRecord,
  type BankRecord,
  type BankResource
} from './api'

type BankFormRecord = {
  id: number
  values: Record<string, string>
  raw: BankRecord
  item?: BankRecord
}

type BankDataPageProps = {
  resource: BankResource
  title: string
  fields: ModulePageField[]
  embedded?: boolean
}

const fieldMappings: Partial<Record<BankResource, Record<string, string>>> = {
  passbooks: {
    bankPassbook: 'bank_name',
    date: 'bank_date',
    transactionDate: 'transaction_date',
    balance: 'balance_amount',
    reconciled: 'is_reconciled'
  },
  books: {
    bankPassbookId: 'bank_name',
    balance: 'balance_amount',
    reconciled: 'is_reconciled'
  },
  receipts: {
    bankPassbookId: 'bank_passbook_id'
  },
  payments: {
    bankPassbookId: 'bank_passbook_id'
  },
  reconciliations: {
    bankPassbookId: 'bank_name',
    unreconciledFromBank: 'unreconciled_transaction_from_bank',
    unreconciledFromBankBook: 'unreconciled_transaction_from_bank_book'
  }
}

const toSnakeCase = (value: string) =>
  value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)

const itemResource = (resource: BankResource): BankResource | undefined => {
  if (resource === 'receipts') return 'receipt-items'
  if (resource === 'payments') return 'payment-items'
  return undefined
}

const itemParentField = (resource: BankResource) =>
  resource === 'receipts' ? 'receipt_id' : 'payment_id'

const toUpdatePayload = (record: BankRecord) =>
  Object.fromEntries(
    Object.entries(record).filter(([key]) => key !== 'id')
  )

const getBankName = (record: BankRecord | undefined) =>
  String(record?.bank_name ?? '')

const bankPassbookOptions = (records: BankRecord[]) => {
  const seen = new Set<string>()
  return records.filter((record) => {
    const bankName = getBankName(record)
    if (!bankName || seen.has(bankName)) return false
    seen.add(bankName)
    return true
  })
}

const BankDataPage = ({
  resource,
  title,
  fields,
  embedded = false
}: BankDataPageProps) => {
  const [records, setRecords] = useState<BankFormRecord[]>([])
  const [passbooks, setPassbooks] = useState<BankRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  const isBankNameSelect = resource === 'books' || resource === 'reconciliations'
  const needsPassbookSelect =
    resource === 'books' ||
    resource === 'receipts' ||
    resource === 'payments' ||
    resource === 'reconciliations'

  const mapRecord = useCallback((
    record: BankRecord,
    item: BankRecord | undefined,
    index: number
  ): BankFormRecord => {
    const values: Record<string, string> = {}
    const isPassbookReference = resource === 'books' || resource === 'reconciliations'

    fields.forEach((field) => {
      let value: unknown
      if (field.name === 'bankPassbookId' && isPassbookReference) {
        value = record.bank_name
      } else if (item && field.name === 'payerGLAccount') {
        value = item.payer_gl_account
      } else if (item && field.name === 'recipientGLAccount') {
        value = item.recipient_gl_account
      } else if (item && field.name === 'billReference') {
        value = item.bill_reference
      } else if (item && field.name === 'creditAmount' && resource === 'receipts') {
        value = item.credit_amount
      } else if (item && field.name === 'debitAmount' && resource === 'payments') {
        value = item.debit_amount
      } else {
        const key = fieldMappings[resource]?.[field.name] ?? toSnakeCase(field.name)
        value = record[key]
      }

      if (field.name === 'bankPassbookId' && !isPassbookReference) {
        value = record.bank_passbook_id
      }
      values[field.name] =
        value === null || value === undefined ? '' : String(value)
    })

    return {
      id: Number(record.id ?? index),
      values,
      raw: record,
      item
    }
  }, [fields, resource])

  useEffect(() => {
    let cancelled = false

    const loadRecords = async () => {
      setIsLoading(true)
      setError('')
      try {
        const lineResource = itemResource(resource)
        const needsPassbooks =
          resource === 'books' ||
          resource === 'receipts' ||
          resource === 'payments' ||
          resource === 'reconciliations'
        const [bankRecords, passbookRecords, itemRecords] = await Promise.all([
          getBankRecords(resource),
          needsPassbooks ? getBankRecords('passbooks') : Promise.resolve([]),
          lineResource ? getBankRecords(lineResource) : Promise.resolve([])
        ])
        if (cancelled) return

        setPassbooks(passbookRecords)
        setRecords(bankRecords.map((record, index) => {
          const item = itemRecords.find(
            (line) => Number(line[itemParentField(resource)!]) === Number(record.id)
          )
          return mapRecord(record, item, index)
        }))
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? `Unable to load ${title} records: ${loadError.message}`
              : `Unable to load ${title} records.`
          )
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadRecords()

    const refreshPassbookOptions = () => {
      if (!needsPassbookSelect) return
      void getBankRecords('passbooks')
        .then((passbookRecords) => {
          if (!cancelled) setPassbooks(passbookRecords)
        })
        .catch((loadError: unknown) => {
          if (!cancelled) {
            setError(
              loadError instanceof Error
                ? `Unable to load bank passbook options: ${loadError.message}`
                : 'Unable to load bank passbook options.'
            )
          }
        })
    }

    window.addEventListener('bank-passbooks-updated', refreshPassbookOptions)
    return () => {
      cancelled = true
      window.removeEventListener('bank-passbooks-updated', refreshPassbookOptions)
    }
  }, [mapRecord, needsPassbookSelect, resource, title])
  const fillForm = (values: Record<string, string>) => {
    const form = formRef.current
    if (!form) return
    fields.forEach((field) => {
      const input = form.elements.namedItem(field.name)
      if (input instanceof HTMLInputElement ||
        input instanceof HTMLSelectElement ||
        input instanceof HTMLTextAreaElement) {
        input.value = values[field.name] ?? ''
      }
    })
  }

  const editRecord = async (record: BankFormRecord) => {
    setError('')
    setSuccess('')
    try {
      const [fullRecord, lines] = await Promise.all([
        getBankRecord(resource, record.id),
        itemResource(resource)
          ? getBankRecords(itemResource(resource)!)
          : Promise.resolve([])
      ])
      const item = lines.find(
        (line) => Number(line[itemParentField(resource)!]) === record.id
      )
      const mappedRecord = mapRecord(fullRecord, item, records.indexOf(record))
      fillForm(mappedRecord.values)
      setEditingId(record.id)
    } catch (editError) {
      setError(
        editError instanceof Error
          ? `Unable to retrieve ${title} record: ${editError.message}`
          : `Unable to retrieve ${title} record.`
      )
    }
  }

  const resetForm = () => {
    formRef.current?.reset()
    setEditingId(null)
  }

  const makePayload = (values: FormData) => {
    const payload: Record<string, unknown> = {}
    const bankNameSelect = resource === 'books' || resource === 'reconciliations'
    const isTransaction = resource === 'receipts' || resource === 'payments'
    const lineFields = new Set([
      'payerGLAccount',
      'recipientGLAccount',
      'billReference',
      ...(resource === 'receipts' ? ['creditAmount'] : []),
      ...(resource === 'payments' ? ['debitAmount'] : [])
    ])

    fields.forEach((field) => {
      if (lineFields.has(field.name)) return
      const value = values.get(field.name)
      const key = fieldMappings[resource]?.[field.name] ?? toSnakeCase(field.name)
      if (value === null || value === '') return

      if (field.name === 'bankPassbookId' && isTransaction) {
        const passbookId = Number(value)
        const selectedPassbook = passbooks.find(
          (passbook) => Number(passbook.id) === passbookId
        )
        payload.bank_passbook_id = passbookId
        if (selectedPassbook) payload.bank_name = getBankName(selectedPassbook)
      } else if (field.name === 'bankPassbookId' && bankNameSelect) {
        payload.bank_name = String(value)
      } else if (field.name === 'reconciled') {
        payload[key] = String(value).toLowerCase() === 'true'
      } else if (field.type === 'number') {
        payload[key] = Number(value)
      } else {
        payload[key] = value
      }
    })

    return payload
  }

  const makeItemPayload = (values: FormData, parentId: number) => {
    if (resource === 'receipts') {
      return {
        receipt_id: parentId,
        payer_gl_account: String(values.get('payerGLAccount') ?? ''),
        bill_reference: String(values.get('billReference') ?? ''),
        credit_amount: Number(values.get('creditAmount'))
      }
    }
    if (resource === 'payments') {
      return {
        payment_id: parentId,
        recipient_gl_account: String(values.get('recipientGLAccount') ?? ''),
        bill_reference: String(values.get('billReference') ?? ''),
        debit_amount: Number(values.get('debitAmount'))
      }
    }
    return undefined
  }

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSaving(true)

    const form = event.currentTarget
    const values = new FormData(form)
    const payload = makePayload(values)
    const lineResource = itemResource(resource)
    try {
      let savedRecord: BankRecord
      let savedItem: BankRecord | undefined
      if (editingId === null) {
        savedRecord = await createBankRecord(resource, payload)
        const linePayload = makeItemPayload(values, Number(savedRecord.id))
        if (lineResource && linePayload) {
          try {
            savedItem = await createBankRecord(lineResource, linePayload)
          } catch (lineError) {
            try {
              await deleteBankRecord(resource, savedRecord.id)
            } catch (cleanupError) {
              const cleanupMessage = cleanupError instanceof Error
                ? cleanupError.message
                : 'Unable to remove the incomplete transaction.'
              throw new Error(
                `Unable to save the transaction item. ${cleanupMessage}`
              )
            }
            throw lineError
          }
        }
      } else {
        const originalRecord = await getBankRecord(resource, editingId)
        const existingItem = records.find((record) => record.id === editingId)?.item
        const originalItem = lineResource && existingItem
          ? await getBankRecord(lineResource, Number(existingItem.id))
          : undefined
        savedRecord = await updateBankRecord(resource, editingId, payload)
        const linePayload = makeItemPayload(values, editingId)
        if (lineResource && linePayload) {
          try {
            savedItem = existingItem
              ? await updateBankRecord(lineResource, Number(existingItem.id), linePayload)
              : await createBankRecord(lineResource, linePayload)
          } catch (lineError) {
            const rollbackErrors: string[] = []
            try {
              await updateBankRecord(
                resource,
                editingId,
                toUpdatePayload(originalRecord)
              )
            } catch (rollbackError) {
              rollbackErrors.push(
                rollbackError instanceof Error
                  ? rollbackError.message
                  : 'Unable to restore the transaction.'
              )
            }

            if (originalItem) {
              try {
                await updateBankRecord(
                  lineResource,
                  Number(originalItem.id),
                  toUpdatePayload(originalItem)
                )
              } catch (rollbackError) {
                rollbackErrors.push(
                  rollbackError instanceof Error
                    ? rollbackError.message
                    : 'Unable to restore the transaction item.'
                )
              }
            } else {
              try {
                const possiblyCreatedItems = await getBankRecords(lineResource)
                await Promise.all(
                  possiblyCreatedItems
                    .filter(
                      (item) =>
                        Number(item[itemParentField(resource)!]) === editingId
                    )
                    .map((item) =>
                      deleteBankRecord(lineResource, Number(item.id))
                    )
                )
              } catch (rollbackError) {
                rollbackErrors.push(
                  rollbackError instanceof Error
                    ? rollbackError.message
                    : 'Unable to remove the incomplete transaction item.'
                )
              }
            }

            if (rollbackErrors.length > 0) {
              throw new Error(
                `${lineError instanceof Error ? lineError.message : 'Unable to save the transaction item.'} Rollback failed: ${rollbackErrors.join('; ')}`
              )
            }
            throw lineError
          }
        }
      }

      const saved = mapRecord(savedRecord, savedItem, records.length)
      setRecords((current) =>
        editingId === null
          ? [...current, saved]
          : current.map((record) => record.id === editingId ? saved : record)
      )
      setSuccess(editingId === null
        ? `${title} saved successfully.`
        : `${title} updated successfully.`)
      if (resource === 'passbooks') {
        window.dispatchEvent(new Event('bank-passbooks-updated'))
      }
      resetForm()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : `Unable to save ${title}.`
      )
    } finally {
      setIsSaving(false)
    }
  }

  const deleteRecord = async (record: BankFormRecord) => {
    setError('')
    setSuccess('')
    setIsSaving(true)
    try {
      await deleteBankRecord(resource, record.id)
      setRecords((current) => current.filter((item) => item.id !== record.id))
      if (resource === 'passbooks') {
        window.dispatchEvent(new Event('bank-passbooks-updated'))
      }
      if (editingId === record.id) resetForm()
      setSuccess(`${title} deleted successfully.`)
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? `Unable to delete ${title} record: ${deleteError.message}`
          : `Unable to delete ${title} record.`
      )
    } finally {
      setIsSaving(false)
    }
  }

  const formContent = (
    <>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {success && <div className="alert alert-success" role="status">{success}</div>}

      {needsPassbookSelect && passbooks.length === 0 && !isLoading && (
        <div className="alert alert-info" role="status">
          Add a Bank Passbook / Statement record before selecting a bank here.
        </div>
      )}

      <form ref={formRef} className="row g-3 mb-4" onSubmit={(event) => void submitForm(event)}>
        {fields.map((field, index) => (
          <Fragment key={`${field.name}-${index}`}>
            {field.section && (
              <div className="col-12 mt-2">
                <h2 className="h5 border-bottom pb-2 mb-0">{field.section}</h2>
              </div>
            )}
            <div className="col-md-6">
              <label
                className="form-label"
                htmlFor={`bank-${resource}-${field.name}-${index}`}
              >
                {field.label}
              </label>
              {field.name === 'bankPassbookId' && needsPassbookSelect ? (
                <select
                  className="form-select"
                  id={`bank-${resource}-${field.name}-${index}`}
                  name={field.name}
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    {isLoading ? 'Loading bank passbooks…' : 'Select bank passbook'}
                  </option>
                  {(isBankNameSelect ? bankPassbookOptions(passbooks) : passbooks).map((passbook) => (
                    <option
                      key={passbook.id}
                      value={isBankNameSelect ? getBankName(passbook) : String(passbook.id)}
                    >
                      {getBankName(passbook)}
                      {passbook.reference_number ? ` — ${String(passbook.reference_number)}` : ''}
                      {passbook.bank_date ? ` (${String(passbook.bank_date)})` : ''}
                    </option>
                  ))}
                </select>
              ) : field.name === 'reconciled' ? (
                <select
                  className="form-select"
                  id={`bank-${resource}-${field.name}-${index}`}
                  name={field.name}
                  required={field.required ?? true}
                  defaultValue=""
                >
                  <option value="" disabled>Select reconciliation status</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  className="form-control"
                  id={`bank-${resource}-${field.name}-${index}`}
                  name={field.name}
                  rows={3}
                  required={field.required ?? true}
                />
              ) : (
                <input
                  className="form-control"
                  id={`bank-${resource}-${field.name}-${index}`}
                  name={field.name}
                  type={field.type ?? 'text'}
                  step={field.type === 'number' ? '0.01' : undefined}
                  required={field.required ?? true}
                />
              )}
            </div>
          </Fragment>
        ))}
        <div className="col-12">
          <button className="btn btn-primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : editingId === null ? `Add ${title}` : `Update ${title}`}
          </button>
          {editingId !== null && (
            <button className="btn btn-secondary ms-2" type="button" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="table-responsive">
        <table className="table table-striped align-middle">
          <thead>
            <tr>
              {fields.map((field) => <th key={field.name} scope="col">{field.label}</th>)}
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td className="text-center text-muted py-4" colSpan={fields.length + 1}>
                  {isLoading ? `Loading ${title.toLowerCase()} records…` : `No ${title.toLowerCase()} records have been added.`}
                </td>
              </tr>
            ) : records.map((record) => (
              <tr key={record.id}>
                {fields.map((field) => {
                  const value = record.values[field.name] ?? ''
                  const displayValue = field.name === 'bankPassbookId' && !isBankNameSelect
                    ? getBankName(passbooks.find((passbook) => String(passbook.id) === value))
                    : field.name === 'reconciled'
                      ? value === 'true' ? 'Yes' : value === 'false' ? 'No' : value
                      : value
                  return <td key={field.name}>{displayValue}</td>
                })}
                <td>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    type="button"
                    disabled={isSaving}
                    onClick={() => void editRecord(record)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger ms-2"
                    type="button"
                    disabled={isSaving}
                    onClick={() => void deleteRecord(record)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )

  return embedded
    ? formContent
    : <ModulePageFrame module="bank" page={title}>{formContent}</ModulePageFrame>
}

export default BankDataPage
