import { useState, type FormEvent } from 'react'
import { Calculator, CalendarDays, PanelRightClose, PanelRightOpen } from 'lucide-react'

const RightSidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [firstNumber, setFirstNumber] = useState('')
  const [secondNumber, setSecondNumber] = useState('')
  const [operation, setOperation] = useState('+')
  const [result, setResult] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState('')

  const calculate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const first = Number(firstNumber)
    const second = Number(secondNumber)
    const value = operation === '+'
      ? first + second
      : operation === '-'
        ? first - second
        : operation === '*'
          ? first * second
          : second === 0
            ? null
            : first / second
    setResult(value)
  }

  return (
    <aside className={`right-sidebar h-100${isExpanded ? ' is-expanded' : ''}`} aria-label="Quick tools">
      <div className="right-sidebar-toggle-row">
        {isExpanded && <h2 className="sidebar-title sidebar-title-tools">Tools</h2>}
        <button
          type="button"
          className="right-sidebar-toggle"
          aria-label={isExpanded ? 'Collapse right sidebar' : 'Expand right sidebar'}
          aria-expanded={isExpanded}
          title={isExpanded ? 'Collapse right sidebar' : 'Expand right sidebar'}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded
            ? <PanelRightClose size={20} aria-hidden="true" />
            : <PanelRightOpen size={20} aria-hidden="true" />}
        </button>
      </div>
      <nav className="right-sidebar-tools" aria-label="Quick tools">
        <div className="right-sidebar-tool">
          <button
            type="button"
            className="right-sidebar-tool-trigger"
            aria-label="Open calculator"
            title="Calculator"
          >
            <Calculator size={21} aria-hidden="true" />
          </button>
          <section className="right-sidebar-popover" aria-label="Calculator">
            <h2 className="h6 mb-3">Calculator</h2>
            <form onSubmit={calculate}>
              <div className="d-flex gap-2 mb-2">
                <input
                  className="form-control form-control-sm"
                  type="number"
                  step="any"
                  aria-label="First number"
                  placeholder="First number"
                  value={firstNumber}
                  onChange={(event) => setFirstNumber(event.currentTarget.value)}
                  required
                />
                <select
                  className="form-select form-select-sm calculator-operation"
                  aria-label="Operation"
                  value={operation}
                  onChange={(event) => setOperation(event.currentTarget.value)}
                >
                  <option value="+">+</option>
                  <option value="-">−</option>
                  <option value="*">×</option>
                  <option value="/">÷</option>
                </select>
              </div>
              <input
                className="form-control form-control-sm mb-2"
                type="number"
                step="any"
                aria-label="Second number"
                placeholder="Second number"
                value={secondNumber}
                onChange={(event) => setSecondNumber(event.currentTarget.value)}
                required
              />
              <button className="btn btn-primary btn-sm w-100" type="submit">
                Calculate
              </button>
            </form>
            {result !== null && (
              <p className="mb-0 mt-3" role="status">
                Result: <strong>{result}</strong>
              </p>
            )}
            {operation === '/' && secondNumber === '0' && (
              <p className="text-danger small mb-0 mt-2" role="alert">
                Cannot divide by zero.
              </p>
            )}
          </section>
        </div>

        <div className="right-sidebar-tool">
          <button
            type="button"
            className="right-sidebar-tool-trigger"
            aria-label="Open calendar"
            title="Calendar"
          >
            <CalendarDays size={21} aria-hidden="true" />
          </button>
          <section className="right-sidebar-popover" aria-label="Calendar">
            <h2 className="h6 mb-3">Calendar</h2>
            <label className="form-label small" htmlFor="quick-calendar-date">
              Select a date
            </label>
            <input
              id="quick-calendar-date"
              className="form-control"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.currentTarget.value)}
            />
            {selectedDate && (
              <p className="small text-muted mb-0 mt-2" role="status">
                Selected: {new Date(`${selectedDate}T00:00:00`).toLocaleDateString()}
              </p>
            )}
          </section>
        </div>
      </nav>
    </aside>
  )
}

export default RightSidebar
