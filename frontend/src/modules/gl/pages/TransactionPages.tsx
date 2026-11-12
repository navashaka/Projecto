import { useEffect, useMemo, useState, type FormEvent } from 'react'
import ModulePageFrame from '../../shared/ModulePageFrame'
import {
  createGLTransaction,
  deleteGLTransaction,
  getGLTransaction,
  getGLTransactions,
  getGLLookups,
  updateGLTransaction,
  type GLLookup,
  type GLTransactionRecord,
  type GLTransactionResource
} from '../glTransactionsApi'

type TransactionKind = 'contra' | 'journal' | 'credit-note' | 'debit-note'

type DetailRow = {
  id: string
  glAccount: string
  item: string
  hsn: string
  qty: string
  rate: string
  amount: string
  gst: string
}

type JournalRow = {
  id: string
  glAccount: string
  debitAmount: string
  creditAmount: string
  costElement: string
}

const resourceFor: Record<TransactionKind, GLTransactionResource> = {
  contra: 'contra-entries',
  journal: 'journal-entries',
  'credit-note': 'credit-notes',
  'debit-note': 'debit-notes'
}

const newId = () => crypto.randomUUID()
const newJournalRow = (): JournalRow => ({
  id: newId(),
  glAccount: '',
  debitAmount: '',
  creditAmount: '',
  costElement: ''
})
const newDetailRow = (): DetailRow => ({
  id: newId(),
  glAccount: '',
  item: '',
  hsn: '',
  qty: '',
  rate: '',
  amount: '',
  gst: ''
})

const numberValue = (value: string) => Number(value || 0)
const money = (value: number) => Number(value.toFixed(2))
const formatMoney = (value: unknown) =>
  Number(value ?? 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

const smallNumberWords = (number: number): string => {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight',
    'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
    'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ]
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  let words = ''
  if (number >= 100) {
    words += `${ones[Math.floor(number / 100)]} Hundred `
    number %= 100
  }
  if (number >= 20) {
    words += `${tens[Math.floor(number / 10)]} `
    number %= 10
  }
  if (number > 0) words += `${ones[number]} `
  return words.trim()
}

const rupeesInWords = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return 'Zero Rupees Only'
  const whole = Math.floor(value)
  let remainder = whole
  const chunks: [number, string][] = [
    [10000000, 'Crore'],
    [100000, 'Lakh'],
    [1000, 'Thousand'],
    [1, '']
  ]
  const words: string[] = []
  for (const [unit, label] of chunks) {
    if (remainder >= unit) {
      const count = Math.floor(remainder / unit)
      words.push(`${smallNumberWords(count)}${label ? ` ${label}` : ''}`)
      remainder %= unit
    }
  }
  const paise = Math.round((value - whole) * 100)
  return `${words.join(' ')} Rupees${paise ? ` and ${smallNumberWords(paise)} Paise` : ''} Only`
}

const asText = (value: unknown) =>
  value === null || value === undefined ? '' : String(value)

type GLTransactionPageProps = {
  kind: TransactionKind
  title: string
}

const GLTransactionPage = ({ kind, title }: GLTransactionPageProps) => {
  const resource = resourceFor[kind]
  const [records, setRecords] = useState<GLTransactionRecord[]>([])
  const [bankCashAccounts, setBankCashAccounts] = useState<GLLookup[]>([])
  const [glAccounts, setGLAccounts] = useState<GLLookup[]>([])
  const [costElements, setCostElements] = useState<GLLookup[]>([])
  const [stockItems, setStockItems] = useState<GLLookup[]>([])
  const [hsnCodes, setHsnCodes] = useState<GLLookup[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [viewRecord, setViewRecord] = useState<GLTransactionRecord | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [bankCash1, setBankCash1] = useState('')
  const [bankCash2, setBankCash2] = useState('')
  const [contraDebit, setContraDebit] = useState('')
  const [contraCredit, setContraCredit] = useState('')
  const [journalDate, setJournalDate] = useState('')
  const [journalRows, setJournalRows] = useState<JournalRow[]>([
    newJournalRow(),
    newJournalRow()
  ])
  const [noteNumber, setNoteNumber] = useState('')
  const [noteDate, setNoteDate] = useState('')
  const [partyName, setPartyName] = useState('')
  const [inventoryRelated, setInventoryRelated] = useState(true)
  const [noteRows, setNoteRows] = useState<DetailRow[]>([newDetailRow()])

  const debitTotal = useMemo(
    () => money(journalRows.reduce((total, row) => total + numberValue(row.debitAmount), 0)),
    [journalRows]
  )
  const creditTotal = useMemo(
    () => money(journalRows.reduce((total, row) => total + numberValue(row.creditAmount), 0)),
    [journalRows]
  )
  const contraTotal = money(numberValue(contraDebit))
  const noteTotal = useMemo(
    () => money(noteRows.reduce(
      (total, row) => total + numberValue(row.amount) + numberValue(row.gst),
      0
    )),
    [noteRows]
  )

  const reload = async () => {
    setIsLoading(true)
    setError('')
    try {
      setRecords(await getGLTransactions(resource))
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? `Unable to load ${title} records: ${loadError.message}`
          : `Unable to load ${title} records.`
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    const loadPage = async () => {
      setIsLoading(true)
      setError('')
      try {
        const [data, bankOptions, accountOptions, costOptions, itemOptions, hsnOptions] =
          await Promise.all([
            getGLTransactions(resource),
            kind === 'contra' ? getGLLookups('bank-cash-accounts') : Promise.resolve([]),
            kind !== 'contra' ? getGLLookups('gl-accounts') : Promise.resolve([]),
            kind === 'journal' ? getGLLookups('cost-elements') : Promise.resolve([]),
            kind === 'credit-note' || kind === 'debit-note'
              ? getGLLookups('stock-items')
              : Promise.resolve([]),
            kind === 'credit-note' || kind === 'debit-note'
              ? getGLLookups('hsn-codes')
              : Promise.resolve([])
          ])
        if (cancelled) return
        setRecords(data)
        setBankCashAccounts(bankOptions)
        setGLAccounts(accountOptions)
        setCostElements(costOptions)
        setStockItems(itemOptions)
        setHsnCodes(hsnOptions)
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? `Unable to load ${title} data: ${loadError.message}`
              : `Unable to load ${title} data.`
          )
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void loadPage()
    return () => {
      cancelled = true
    }
  }, [kind, resource, title])

  const resetForm = () => {
    setEditingId(null)
    setBankCash1('')
    setBankCash2('')
    setContraDebit('')
    setContraCredit('')
    setJournalDate('')
    setJournalRows([newJournalRow(), newJournalRow()])
    setNoteNumber('')
    setNoteDate('')
    setPartyName('')
    setInventoryRelated(true)
    setNoteRows([newDetailRow()])
  }

  const editRecord = async (record: GLTransactionRecord) => {
    setError('')
    setSuccess('')
    try {
      const detail = await getGLTransaction(resource, record.id)
      setEditingId(record.id)
      if (kind === 'contra') {
        setBankCash1(asText(detail.bank_cash_account_1))
        setBankCash2(asText(detail.bank_cash_account_2))
        setContraDebit(asText(detail.debit_amount))
        setContraCredit(asText(detail.credit_amount))
      } else if (kind === 'journal') {
        setJournalDate(asText(detail.date))
        const rows = Array.isArray(detail.items) ? detail.items as Record<string, unknown>[] : []
        setJournalRows(rows.map((row) => ({
          id: newId(),
          glAccount: asText(row.gl_account),
          debitAmount: asText(row.debit_amount),
          creditAmount: asText(row.credit_amount),
          costElement: asText(row.cost_element)
        })))
      } else {
        setNoteNumber(asText(detail[kind === 'credit-note' ? 'credit_note_number' : 'debit_note_number']))
        setNoteDate(asText(detail.date))
        setPartyName(asText(detail.party_name))
        setInventoryRelated(Boolean(detail.inventory_related))
        const lines = detail.inventory_related
          ? detail.items
          : detail.accounts
        const rows = Array.isArray(lines) ? lines as Record<string, unknown>[] : []
        setNoteRows(rows.map((row) => ({
          id: newId(),
          glAccount: asText(row.gl_account),
          item: asText(row.item),
          hsn: asText(row.hsn),
          qty: asText(row.qty),
          rate: asText(row.rate),
          amount: asText(row.amount),
          gst: asText(row.gst)
        })))
      }
    } catch (editError) {
      setError(
        editError instanceof Error
          ? `Unable to retrieve ${title}: ${editError.message}`
          : `Unable to retrieve ${title}.`
      )
    }
  }

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    let payload: Record<string, unknown>

    if (kind === 'contra') {
      if (bankCash1 === bankCash2) {
        setError('Select two different Bank/Cash accounts.')
        return
      }
      if (numberValue(contraDebit) <= 0 || numberValue(contraDebit) !== numberValue(contraCredit)) {
        setError('Contra debit and credit amounts must be equal and greater than zero.')
        return
      }
      payload = {
        bank_cash_account_1: bankCash1,
        bank_cash_account_2: bankCash2,
        debit_amount: money(numberValue(contraDebit)),
        credit_amount: money(numberValue(contraCredit)),
        total: contraTotal
      }
    } else if (kind === 'journal') {
      if (journalRows.length < 2 || debitTotal <= 0 || debitTotal !== creditTotal) {
        setError('Journal debit and credit totals must be equal and greater than zero.')
        return
      }
      const invalidCost = journalRows.some((row) => {
        const account = glAccounts.find((option) => option.label === row.glAccount)
        return Boolean(account?.requires_cost_element && !row.costElement)
      })
      if (journalRows.some((row) => !row.glAccount) || invalidCost) {
        setError('Select a GL Account for every row and a Cost Element for each Income/Expense account.')
        return
      }
      payload = {
        date: journalDate,
        total: debitTotal,
        items: journalRows.map((row) => ({
          gl_account: row.glAccount,
          debit_amount: money(numberValue(row.debitAmount)),
          credit_amount: money(numberValue(row.creditAmount)),
          cost_element: row.costElement || null
        }))
      }
    } else {
      if (noteRows.length === 0 || noteRows.some((row) =>
        inventoryRelated
          ? !row.item || !row.hsn || numberValue(row.qty) <= 0
          : !row.glAccount
      )) {
        setError('Complete the required fields in each note detail row.')
        return
      }
      const numberField = kind === 'credit-note' ? 'credit_note_number' : 'debit_note_number'
      payload = {
        [numberField]: noteNumber,
        date: noteDate,
        party_name: partyName,
        inventory_related: inventoryRelated,
        total: noteTotal,
        rupees_in_words: rupeesInWords(noteTotal),
        items: inventoryRelated ? noteRows.map((row) => ({
          item: row.item,
          hsn: row.hsn,
          qty: numberValue(row.qty),
          rate: money(numberValue(row.rate)),
          amount: money(numberValue(row.amount)),
          gst: money(numberValue(row.gst)),
          total_amount: money(numberValue(row.amount) + numberValue(row.gst))
        })) : [],
        accounts: inventoryRelated ? [] : noteRows.map((row) => ({
          gl_account: row.glAccount,
          amount: money(numberValue(row.amount)),
          gst: money(numberValue(row.gst)),
          total_amount: money(numberValue(row.amount) + numberValue(row.gst))
        }))
      }
    }

    setIsSaving(true)
    try {
      if (editingId === null) {
        await createGLTransaction(resource, payload)
      } else {
        await updateGLTransaction(resource, editingId, payload)
      }
      setSuccess(editingId === null ? `${title} saved successfully.` : `${title} updated successfully.`)
      resetForm()
      await reload()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : `Unable to save ${title}.`)
    } finally {
      setIsSaving(false)
    }
  }

  const deleteRecord = async (record: GLTransactionRecord) => {
    setError('')
    setSuccess('')
    setIsSaving(true)
    try {
      await deleteGLTransaction(resource, record.id)
      if (editingId === record.id) resetForm()
      setSuccess(`${title} deleted successfully.`)
      await reload()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : `Unable to delete ${title}.`)
    } finally {
      setIsSaving(false)
    }
  }

  const updateNoteRow = (id: string, patch: Partial<DetailRow>) => {
    setNoteRows((current) => current.map((row) => {
      if (row.id !== id) return row
      const updated = { ...row, ...patch }
      if (inventoryRelated && ('qty' in patch || 'rate' in patch)) {
        updated.amount = money(numberValue(updated.qty) * numberValue(updated.rate)).toFixed(2)
      }
      return updated
    }))
  }

  const listColumns = kind === 'contra'
    ? ['Bank/Cash 1', 'Bank/Cash 2', 'Debit', 'Credit', 'Total']
    : kind === 'journal'
      ? ['Date', 'Rows', 'Debit Total', 'Credit Total']
      : [kind === 'credit-note' ? 'Credit Note No.' : 'Debit Note No.', 'Date', 'Party', 'Inventory Related', 'Total']

  return (
    <ModulePageFrame module="gl" page={title}>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {success && <div className="alert alert-success" role="status">{success}</div>}

      <form className="row g-3 mb-4" onSubmit={(event) => void save(event)}>
        {kind === 'contra' && (
          <>
            <div className="col-12"><h2 className="h5 border-bottom pb-2">Contra Entry Rows</h2></div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="contra-account-1">Select Bank/Cash (Debit)</label>
              <select id="contra-account-1" className="form-select" value={bankCash1} onChange={(event) => setBankCash1(event.target.value)} required>
                <option value="">Select Bank/Cash account</option>
                {bankCashAccounts.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="contra-debit">Debit Amount</label>
              <input id="contra-debit" className="form-control" type="number" min="0.01" step="0.01" value={contraDebit} onChange={(event) => setContraDebit(event.target.value)} required />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="contra-account-2">Select Bank/Cash (Credit)</label>
              <select id="contra-account-2" className="form-select" value={bankCash2} onChange={(event) => setBankCash2(event.target.value)} required>
                <option value="">Select Bank/Cash account</option>
                {bankCashAccounts.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="contra-credit">Credit Amount</label>
              <input id="contra-credit" className="form-control" type="number" min="0.01" step="0.01" value={contraCredit} onChange={(event) => setContraCredit(event.target.value)} required />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="contra-total">Total</label>
              <input id="contra-total" className="form-control" value={formatMoney(contraTotal)} readOnly />
            </div>
          </>
        )}

        {kind === 'journal' && (
          <>
            <div className="col-md-6">
              <label className="form-label" htmlFor="journal-date">Date</label>
              <input id="journal-date" className="form-control" type="date" value={journalDate} onChange={(event) => setJournalDate(event.target.value)} required />
            </div>
            <div className="col-12"><h2 className="h5 border-bottom pb-2">Journal Entry Rows</h2></div>
            {journalRows.map((row, index) => {
              const account = glAccounts.find((option) => option.label === row.glAccount)
              return (
                <div className="col-12 row g-3 align-items-end" key={row.id}>
                  <div className="col-md-4">
                    <label className="form-label" htmlFor={`journal-account-${index}`}>GL Account</label>
                    <select id={`journal-account-${index}`} className="form-select" value={row.glAccount} onChange={(event) => setJournalRows((current) => current.map((item) => item.id === row.id ? { ...item, glAccount: event.target.value, costElement: '' } : item))} required>
                      <option value="">Select GL Account</option>
                      {glAccounts.map((option) => <option key={option.id} value={option.label}>{option.label}</option>)}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label" htmlFor={`journal-debit-${index}`}>Debit Rs.</label>
                    <input id={`journal-debit-${index}`} className="form-control" type="number" min="0" step="0.01" value={row.debitAmount} onChange={(event) => setJournalRows((current) => current.map((item) => item.id === row.id ? { ...item, debitAmount: event.target.value } : item))} />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label" htmlFor={`journal-credit-${index}`}>Credit Rs.</label>
                    <input id={`journal-credit-${index}`} className="form-control" type="number" min="0" step="0.01" value={row.creditAmount} onChange={(event) => setJournalRows((current) => current.map((item) => item.id === row.id ? { ...item, creditAmount: event.target.value } : item))} />
                  </div>
                  {account?.requires_cost_element && (
                    <div className="col-md-3">
                      <label className="form-label" htmlFor={`journal-cost-${index}`}>Cost Element</label>
                      <select id={`journal-cost-${index}`} className="form-select" value={row.costElement} onChange={(event) => setJournalRows((current) => current.map((item) => item.id === row.id ? { ...item, costElement: event.target.value } : item))} required>
                        <option value="">Select Cost Element</option>
                        {costElements.map((option) => <option key={option.id} value={option.label}>{option.label}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="col-md-1">
                    <button className="btn btn-outline-danger" type="button" disabled={journalRows.length <= 2} onClick={() => setJournalRows((current) => current.filter((item) => item.id !== row.id))}>Remove</button>
                  </div>
                </div>
              )
            })}
            <div className="col-12">
              <button className="btn btn-outline-primary" type="button" onClick={() => setJournalRows((current) => [...current, newJournalRow()])}>Add Journal Row</button>
              <p className="mt-3 mb-0">Debit Total: {formatMoney(debitTotal)} | Credit Total: {formatMoney(creditTotal)} | Total: {formatMoney(debitTotal)}</p>
            </div>
          </>
        )}

        {(kind === 'credit-note' || kind === 'debit-note') && (
          <>
            <div className="col-md-4">
              <label className="form-label" htmlFor="note-number">{kind === 'credit-note' ? 'Credit Note No.' : 'Debit Note No.'}</label>
              <input id="note-number" className="form-control" value={noteNumber} onChange={(event) => setNoteNumber(event.target.value)} required />
            </div>
            <div className="col-md-4">
              <label className="form-label" htmlFor="note-date">Date</label>
              <input id="note-date" className="form-control" type="date" value={noteDate} onChange={(event) => setNoteDate(event.target.value)} required />
            </div>
            <div className="col-md-4">
              <label className="form-label" htmlFor="note-party">Name of the Party</label>
              <input id="note-party" className="form-control" value={partyName} onChange={(event) => setPartyName(event.target.value)} required />
            </div>
            <div className="col-md-4">
              <label className="form-label" htmlFor="inventory-related">Inventory Related</label>
              <select id="inventory-related" className="form-select" value={inventoryRelated ? 'yes' : 'no'} onChange={(event) => {
                const related = event.target.value === 'yes'
                setInventoryRelated(related)
                setNoteRows([newDetailRow()])
              }}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div className="col-12"><h2 className="h5 border-bottom pb-2">{inventoryRelated ? 'Inventory Items' : 'GL Account Details'}</h2></div>
            {noteRows.map((row, index) => (
              <div className="col-12 row g-3 align-items-end" key={row.id}>
                {inventoryRelated ? (
                  <>
                    <div className="col-md-3">
                      <label className="form-label" htmlFor={`note-item-${index}`}>Item</label>
                      <select id={`note-item-${index}`} className="form-select" value={row.item} onChange={(event) => updateNoteRow(row.id, { item: event.target.value })} required>
                        <option value="">Select Item</option>
                        {stockItems.map((option) => <option key={option.id} value={option.label}>{option.label}</option>)}
                      </select>
                    </div>
                    <div className="col-md-2">
                      <label className="form-label" htmlFor={`note-hsn-${index}`}>HSN</label>
                      <select id={`note-hsn-${index}`} className="form-select" value={row.hsn} onChange={(event) => updateNoteRow(row.id, { hsn: event.target.value })} required>
                        <option value="">Select HSN</option>
                        {hsnCodes.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                      </select>
                    </div>
                    <div className="col-md-1">
                      <label className="form-label" htmlFor={`note-qty-${index}`}>Qty</label>
                      <input id={`note-qty-${index}`} className="form-control" type="number" min="0.001" step="0.001" value={row.qty} onChange={(event) => updateNoteRow(row.id, { qty: event.target.value })} required />
                    </div>
                    <div className="col-md-1">
                      <label className="form-label" htmlFor={`note-rate-${index}`}>Rate</label>
                      <input id={`note-rate-${index}`} className="form-control" type="number" min="0" step="0.01" value={row.rate} onChange={(event) => updateNoteRow(row.id, { rate: event.target.value })} required />
                    </div>
                  </>
                ) : (
                  <div className="col-md-4">
                    <label className="form-label" htmlFor={`note-account-${index}`}>Select GL Account</label>
                    <select id={`note-account-${index}`} className="form-select" value={row.glAccount} onChange={(event) => updateNoteRow(row.id, { glAccount: event.target.value })} required>
                      <option value="">Select GL Account</option>
                      {glAccounts.map((option) => <option key={option.id} value={option.label}>{option.label}</option>)}
                    </select>
                  </div>
                )}
                <div className="col-md-2">
                  <label className="form-label" htmlFor={`note-amount-${index}`}>Amount</label>
                  <input id={`note-amount-${index}`} className="form-control" type="number" min="0" step="0.01" value={row.amount} readOnly={inventoryRelated} onChange={(event) => updateNoteRow(row.id, { amount: event.target.value })} required />
                </div>
                <div className="col-md-2">
                  <label className="form-label" htmlFor={`note-gst-${index}`}>GST Amount</label>
                  <input id={`note-gst-${index}`} className="form-control" type="number" min="0" step="0.01" value={row.gst} onChange={(event) => updateNoteRow(row.id, { gst: event.target.value })} required />
                </div>
                <div className="col-md-2">
                  <label className="form-label" htmlFor={`note-line-total-${index}`}>Line Total</label>
                  <input id={`note-line-total-${index}`} className="form-control" value={formatMoney(numberValue(row.amount) + numberValue(row.gst))} readOnly />
                </div>
                <div className="col-md-1">
                  <button className="btn btn-outline-danger" type="button" disabled={noteRows.length <= 1} onClick={() => setNoteRows((current) => current.filter((item) => item.id !== row.id))}>Remove</button>
                </div>
              </div>
            ))}
            <div className="col-12">
              <button className="btn btn-outline-primary" type="button" onClick={() => setNoteRows((current) => [...current, newDetailRow()])}>Add Detail Row</button>
            </div>
            <div className="col-md-4">
              <label className="form-label" htmlFor="note-total">Total</label>
              <input id="note-total" className="form-control" value={formatMoney(noteTotal)} readOnly />
            </div>
            <div className="col-md-8">
              <label className="form-label" htmlFor="note-words">Rupees in Words</label>
              <input id="note-words" className="form-control" value={rupeesInWords(noteTotal)} readOnly />
            </div>
          </>
        )}

        <div className="col-12">
          <button className="btn btn-primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : editingId === null ? `Add ${title}` : `Update ${title}`}
          </button>
          {editingId !== null && <button className="btn btn-secondary ms-2" type="button" onClick={resetForm}>Cancel</button>}
        </div>
      </form>

      <div className="table-responsive">
        <table className="table table-striped align-middle">
          <thead><tr>{listColumns.map((column) => <th key={column}>{column}</th>)}<th>Actions</th></tr></thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td className="text-center text-muted py-4" colSpan={listColumns.length + 1}>{isLoading ? `Loading ${title} records…` : `No ${title.toLowerCase()} records have been added.`}</td></tr>
            ) : records.map((record) => (
              <tr key={record.id}>
                {kind === 'contra' && (
                  <>
                    <td>{bankCashAccounts.find((account) => account.id === record.bank_cash_account_1)?.label ?? asText(record.bank_cash_account_1)}</td>
                    <td>{bankCashAccounts.find((account) => account.id === record.bank_cash_account_2)?.label ?? asText(record.bank_cash_account_2)}</td>
                    <td>{formatMoney(record.debit_amount)}</td>
                    <td>{formatMoney(record.credit_amount)}</td>
                    <td>{formatMoney(record.total)}</td>
                  </>
                )}
                {kind === 'journal' && (
                  <>
                    <td>{asText(record.date)}</td>
                    <td>{Array.isArray(record.items) ? record.items.length : 0}</td>
                    <td>{formatMoney(record.total)}</td>
                    <td>{formatMoney(record.total)}</td>
                  </>
                )}
                {(kind === 'credit-note' || kind === 'debit-note') && (
                  <>
                    <td>{asText(record[kind === 'credit-note' ? 'credit_note_number' : 'debit_note_number'])}</td>
                    <td>{asText(record.date)}</td>
                    <td>{asText(record.party_name)}</td>
                    <td>{record.inventory_related ? 'Yes' : 'No'}</td>
                    <td>{formatMoney(record.total)}</td>
                  </>
                )}
                <td>
                  <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => setViewRecord(record)}>View</button>
                  <button className="btn btn-sm btn-outline-primary ms-2" type="button" disabled={isSaving} onClick={() => void editRecord(record)}>Edit</button>
                  <button className="btn btn-sm btn-outline-danger ms-2" type="button" disabled={isSaving} onClick={() => void deleteRecord(record)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewRecord && (
        <div className="modal d-block" role="dialog" aria-modal="true" aria-labelledby="gl-transaction-view-title" style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title h5" id="gl-transaction-view-title">{title} Details</h2>
                <button className="btn-close" type="button" onClick={() => setViewRecord(null)} aria-label="Close" />
              </div>
              <div className="modal-body"><pre className="mb-0 text-wrap">{JSON.stringify(viewRecord, null, 2)}</pre></div>
              <div className="modal-footer"><button className="btn btn-secondary" type="button" onClick={() => setViewRecord(null)}>Close</button></div>
            </div>
          </div>
        </div>
      )}
    </ModulePageFrame>
  )
}

export const ContraEntryPage = () => <GLTransactionPage kind="contra" title="Contra Entry" />
export const JournalEntryPage = () => <GLTransactionPage kind="journal" title="Journal" />
export const CreditNotePage = () => <GLTransactionPage kind="credit-note" title="Credit Note" />
export const DebitNotePage = () => <GLTransactionPage kind="debit-note" title="Debit Note" />
