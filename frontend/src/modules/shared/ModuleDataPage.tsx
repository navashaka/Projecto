import { Fragment, useState, type FormEvent } from 'react'
import ModulePageFrame from './ModulePageFrame'
import type { ModuleId, ModulePageField } from '../types'

type ModuleDataPageProps = {
  module: ModuleId
  title: string
  fields: ModulePageField[]
}

type PageRecord = {
  id: string
  values: Record<string, string>
}

type BudgetRow = {
  type: string
  amount: string
}

const numberToWords = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) return 'Zero Rupees Only'

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
    'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen',
    'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ]
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty',
    'Seventy', 'Eighty', 'Ninety'
  ]

  const belowThousand = (n: number): string => {
    let result = ''
    if (n >= 100) {
      result += `${ones[Math.floor(n / 100)]} Hundred `
      n %= 100
    }
    if (n >= 20) {
      result += `${tens[Math.floor(n / 10)]} `
      n %= 10
    }
    if (n > 0) result += `${ones[n]} `
    return result.trim()
  }

  const whole = Math.floor(value)
  const parts: string[] = []
  let n = whole

  const groups: [number, string][] = [
    [10000000, 'Crore'],
    [100000, 'Lakh'],
    [1000, 'Thousand'],
    [1, '']
  ]

  for (const [unit, label] of groups) {
    if (n >= unit) {
      const amount = Math.floor(n / unit)
      parts.push(`${belowThousand(amount)}${label ? ` ${label}` : ''}`)
      n %= unit
    }
  }

  const paise = Math.round((value - whole) * 100)
  return `${parts.join(' ')} Rupees${paise ? ` and ${belowThousand(paise)} Paise` : ''} Only`
}

const ModuleDataPage = ({ module, title, fields }: ModuleDataPageProps) => {
  const [records, setRecords] = useState<PageRecord[]>([])
  const isTravellingAdvance = module === 'hr' && title === 'Travelling Advance'

  const [employeeCode, setEmployeeCode] = useState('')
  const [employeeName, setEmployeeName] = useState('')
  const [designation, setDesignation] = useState('')
  const [department, setDepartment] = useState('')
  const [placeToBeVisited, setPlaceToBeVisited] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [purpose, setPurpose] = useState('')
  const [budgets, setBudgets] = useState<BudgetRow[]>([{ type: '', amount: '' }])
  const [otherExpenseType, setOtherExpenseType] = useState('')
  const [otherExpenseAmount, setOtherExpenseAmount] = useState('')
  const [showReview, setShowReview] = useState(false)
  const [lookupMessage, setLookupMessage] = useState('')
  const [submitMessage, setSubmitMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const budgetTotal = budgets.reduce(
    (total, row) => total + (Number(row.amount) || 0),
    0
  )
  const totalAdvance = budgetTotal + (Number(otherExpenseAmount) || 0)
  const totalWords = numberToWords(totalAdvance)

  const lookupEmployee = async (code: string) => {
    if (!code.trim()) return

    try {
      setLookupMessage('Searching employee...')

      const response = await fetch(
        `http://127.0.0.1:8000/api/v1/employment/by-code/${encodeURIComponent(code.trim())}`
      )

      if (!response.ok) throw new Error('Employee not found')

      const data = await response.json()
      setEmployeeName(data.employee_name ?? data.name ?? '')
      setDesignation(data.designation ?? '')
      setDepartment(data.department ?? '')
      setLookupMessage('Employee details loaded.')
    } catch {
      setLookupMessage('Employee details could not be loaded. Please verify the employee code and API connection.')
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setShowReview(true)
  }

  const submitTravellingAdvance = async () => {
    setSubmitting(true)
    setSubmitMessage('')

    const payload = {
      employee_code: employeeCode,
      employee_name: employeeName,
      designation,
      department,
      from_date: fromDate || null,
      to_date: toDate || null,
      place_to_be_visited: placeToBeVisited,
      purpose_of_visit: purpose,
      budget_items: budgets
        .filter((row) => row.type.trim())
        .map((row) => ({
          type_of_budget: row.type,
          amount: Number(row.amount) || 0
        })),
      other_expense_type: otherExpenseType,
      other_expense_amount: Number(otherExpenseAmount) || 0,
      total_advance: totalAdvance,
      total_advance_words: totalWords
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/travelling-advance/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Unable to save travelling advance.')
      }

      setRecords((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          values: {
            employeeCode,
            employeeName,
            designation,
            department,
            fromDate,
            toDate,
            placeToBeVisited,
            purpose,
            typeOfBudget: budgets.map((row) => row.type).join(', '),
            budgetAmount: String(budgetTotal),
            otherExpenseType,
            otherExpenseAmount,
            totalAdvance: String(totalAdvance),
            totalAdvanceWords: totalWords
          }
        }
      ])

      setSubmitMessage('Travelling Advance submitted successfully.')
      setShowReview(false)
      setEmployeeCode('')
      setEmployeeName('')
      setDesignation('')
      setDepartment('')
      setPlaceToBeVisited('')
      setFromDate('')
      setToDate('')
      setPurpose('')
      setBudgets([{ type: '', amount: '' }])
      setOtherExpenseType('')
      setOtherExpenseAmount('')
    } catch (error) {
      setSubmitMessage(
        error instanceof Error
          ? `Submit failed: ${error.message}`
          : 'Submit failed. Check the backend API.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModulePageFrame module={module} page={title}>
      {isTravellingAdvance ? (
        <>
          <div className="alert alert-info" role="status">
            Fill in the travelling advance details and review them before submitting.
          </div>

          <form className="row g-3 mb-4" onSubmit={handleSubmit}>
            <div className="col-md-6">
              <label className="form-label" htmlFor="ta-employee-code">Employee Code</label>
              <input
                id="ta-employee-code"
                className="form-control"
                value={employeeCode}
                onChange={(e) => {
                  const code = e.target.value
                  setEmployeeCode(code)
                  setEmployeeName('')
                  setDesignation('')
                  setDepartment('')
                  setLookupMessage('')

                  if (code.trim()) {
                    window.setTimeout(() => {
                      void lookupEmployee(code)
                    }, 400)
                  }
                }}
                required
              />
              {lookupMessage && <small className="text-muted">{lookupMessage}</small>}
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="ta-employee-name">Employee Name</label>
              <input id="ta-employee-name" className="form-control" value={employeeName} readOnly required />
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="ta-designation">Designation</label>
              <input id="ta-designation" className="form-control" value={designation} readOnly />
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="ta-department">Department</label>
              <input id="ta-department" className="form-control" value={department} readOnly />
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="ta-from-date">From Date</label>
              <input id="ta-from-date" className="form-control" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} required />
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="ta-to-date">To Date</label>
              <input id="ta-to-date" className="form-control" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} required />
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="ta-place">Place to be Visited</label>
              <input id="ta-place" className="form-control" value={placeToBeVisited} onChange={(e) => setPlaceToBeVisited(e.target.value)} required />
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="ta-purpose">Purpose of Visit</label>
              <textarea id="ta-purpose" className="form-control" rows={2} value={purpose} onChange={(e) => setPurpose(e.target.value)} required />
            </div>

            <div className="col-12 mt-4">
              <h2 className="h5 border-bottom pb-2">Type of Budget</h2>
            </div>

            {budgets.map((row, index) => (
              <Fragment key={index}>
                <div className="col-md-6">
                  <label className="form-label">Budget Type {index + 1}</label>
                  <input
                    className="form-control"
                    value={row.type}
                    onChange={(e) => setBudgets((current) => current.map((item, i) => i === index ? { ...item, type: e.target.value } : item))}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Amount</label>
                  <input
                    className="form-control"
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.amount}
                    onChange={(e) => setBudgets((current) => current.map((item, i) => i === index ? { ...item, amount: e.target.value } : item))}
                    required
                  />
                </div>
                <div className="col-md-2 d-flex align-items-end">
                  <button
                    className="btn btn-outline-danger"
                    type="button"
                    disabled={budgets.length === 1}
                    onClick={() => setBudgets((current) => current.filter((_, i) => i !== index))}
                  >
                    Remove
                  </button>
                </div>
              </Fragment>
            ))}

            <div className="col-12">
              <button className="btn btn-outline-primary" type="button" onClick={() => setBudgets((current) => [...current, { type: '', amount: '' }])}>
                + Add Budget
              </button>
            </div>

            <div className="col-12 mt-4">
              <h2 className="h5 border-bottom pb-2">Other Expense</h2>
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="ta-other-type">Other Expense Type</label>
              <input id="ta-other-type" className="form-control" value={otherExpenseType} onChange={(e) => setOtherExpenseType(e.target.value)} />
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="ta-other-amount">Other Expense Amount</label>
              <input id="ta-other-amount" className="form-control" type="number" min="0" step="0.01" value={otherExpenseAmount} onChange={(e) => setOtherExpenseAmount(e.target.value)} />
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="ta-total">Total Advance</label>
              <input id="ta-total" className="form-control" value={totalAdvance.toFixed(2)} readOnly />
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="ta-words">Value in Words</label>
              <input id="ta-words" className="form-control" value={totalWords} readOnly />
            </div>

            <div className="col-12">
              <button className="btn btn-primary" type="submit">Review</button>
            </div>
          </form>

          {submitMessage && <div className="alert alert-info" role="status">{submitMessage}</div>}

          {showReview && (
            <div className="modal d-block" role="dialog" aria-modal="true" aria-labelledby="ta-review-title" style={{ background: 'rgba(0,0,0,0.45)' }}>
              <div className="modal-dialog modal-lg modal-dialog-scrollable">
                <div className="modal-content">
                  <div className="modal-header">
                    <h2 className="modal-title h5" id="ta-review-title">Review Travelling Advance</h2>
                    <button className="btn-close" type="button" onClick={() => setShowReview(false)} aria-label="Close" />
                  </div>
                  <div className="modal-body">
                    <p><strong>Employee Code:</strong> {employeeCode}</p>
                    <p><strong>Employee Name:</strong> {employeeName}</p>
                    <p><strong>Designation:</strong> {designation}</p>
                    <p><strong>Department:</strong> {department}</p>
                    <p><strong>From / To:</strong> {fromDate} — {toDate}</p>
                    <p><strong>Place to be Visited:</strong> {placeToBeVisited}</p>
                    <p><strong>Purpose:</strong> {purpose}</p>
                    <h3 className="h6">Budget Items</h3>
                    <table className="table table-sm table-striped">
                      <thead><tr><th>Type</th><th>Amount</th></tr></thead>
                      <tbody>
                        {budgets.map((row, index) => (
                          <tr key={index}><td>{row.type}</td><td>{Number(row.amount || 0).toFixed(2)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                    <p><strong>Other Expense:</strong> {otherExpenseType || '—'} — {(Number(otherExpenseAmount) || 0).toFixed(2)}</p>
                    <p><strong>Total Advance:</strong> {totalAdvance.toFixed(2)}</p>
                    <p><strong>Value in Words:</strong> {totalWords}</p>
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-secondary" type="button" onClick={() => setShowReview(false)}>Back to Edit</button>
                    <button className="btn btn-primary" type="button" disabled={submitting} onClick={submitTravellingAdvance}>
                      {submitting ? 'Submitting...' : 'Confirm & Submit'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead><tr><th>Employee Code</th><th>Employee Name</th><th>Place</th><th>Total Advance</th><th>Value in Words</th></tr></thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td className="text-center text-muted py-4" colSpan={5}>No travelling advance records have been added.</td></tr>
                ) : records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.values.employeeCode}</td>
                    <td>{record.values.employeeName}</td>
                    <td>{record.values.placeToBeVisited}</td>
                    <td>{record.values.totalAdvance}</td>
                    <td>{record.values.totalAdvanceWords}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className="alert alert-info" role="status">
            Entries on this page are held in the current browser session and are not saved to the database yet.
          </div>

          <form className="row g-3 mb-4" onSubmit={(event) => {
            event.preventDefault()
            const values = Object.fromEntries(
              Array.from(new FormData(event.currentTarget).entries()).map(([key, value]) => [key, String(value)])
            )
            setRecords((current) => [...current, { id: crypto.randomUUID(), values }])
            event.currentTarget.reset()
          }}>
            {fields.map((field, index) => (
              <Fragment key={field.name}>
                {field.section && (index === 0 || fields[index - 1].section !== field.section) && (
                  <div className="col-12 mt-2">
                    <h2 className="h5 border-bottom pb-2 mb-0">{field.section}</h2>
                  </div>
                )}
                <div className="col-md-6">
                  <label className="form-label" htmlFor={`${module}-${field.name}`}>{field.label}</label>
                  {field.type === 'select' ? (
                    <select className="form-select" id={`${module}-${field.name}`} name={field.name} required={field.required ?? true} defaultValue="">
                      <option value="" disabled>Select {field.label.toLowerCase()}</option>
                      {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea className="form-control" id={`${module}-${field.name}`} name={field.name} required={field.required ?? true} rows={3} />
                  ) : (
                    <input className="form-control" id={`${module}-${field.name}`} name={field.name} type={field.type ?? 'text'} required={field.required ?? true} />
                  )}
                </div>
              </Fragment>
            ))}
            <div className="col-12">
              <button className="btn btn-primary" type="submit">Add {title}</button>
            </div>
          </form>

          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead><tr>{fields.map((field) => <th key={field.name} scope="col">{field.label}</th>)}</tr></thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td className="text-center text-muted py-4" colSpan={fields.length}>No {title.toLowerCase()} records have been added.</td></tr>
                ) : records.map((record) => (
                  <tr key={record.id}>{fields.map((field) => <td key={field.name}>{record.values[field.name]}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </ModulePageFrame>
  )
}

export default ModuleDataPage