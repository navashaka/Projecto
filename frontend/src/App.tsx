import { useState, type FormEvent } from 'react'
import { Bell, BriefcaseBusiness, CalendarDays, Check, ChevronRight, CircleUserRound, FileText, LayoutDashboard, Menu, Plus, Search, Settings, Users, X } from 'lucide-react'
import './App.css'

type FormKey = 'employee' | 'department' | 'leave' | 'recruitment'

const formOptions: { key: FormKey; label: string; description: string; icon: typeof Users }[] = [
  { key: 'employee', label: 'Add employee', description: 'Create a new employee profile', icon: Users },
  { key: 'department', label: 'New department', description: 'Set up a team or business unit', icon: BriefcaseBusiness },
  { key: 'leave', label: 'Leave request', description: 'Record time off for an employee', icon: CalendarDays },
  { key: 'recruitment', label: 'Candidate enquiry', description: 'Capture a candidate application', icon: FileText },
]

const inputClass = 'form-input'

function Field({ label, name, type = 'text', placeholder, required = false }: { label: string; name: string; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <label className="field">
      <span>{label}{required && <em> *</em>}</span>
      <input className={inputClass} name={name} type={type} placeholder={placeholder} required={required} />
    </label>
  )
}

function SelectField({ label, name, options, required = false }: { label: string; name: string; options: string[]; required?: boolean }) {
  return (
    <label className="field">
      <span>{label}{required && <em> *</em>}</span>
      <select className={inputClass} name={name} defaultValue="" required={required}>
        <option value="" disabled>Select {label.toLowerCase()}</option>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  )
}

function FormPanel({ activeForm }: { activeForm: FormKey }) {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    event.currentTarget.reset()
  }

  const title = formOptions.find((option) => option.key === activeForm)?.label ?? 'HR form'

  return (
    <section className="form-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">HR workspace / Forms</p>
          <h2>{title}</h2>
          <p className="muted">Complete the details below. Required fields are marked with an asterisk.</p>
        </div>
        <span className="draft-badge"><span className="status-dot" /> Draft mode</span>
      </div>
      {submitted && <div className="success-banner"><Check size={18} /> Form saved locally. Connect this submit action to the HR API when the endpoint is ready.</div>}
      <form onSubmit={handleSubmit}>
        {activeForm === 'employee' && <>
          <div className="form-section"><h3>Personal details</h3><div className="form-grid"><Field label="First name" name="first_name" required /><Field label="Last name" name="last_name" required /><Field label="Work email" name="email" type="email" placeholder="name@company.com" required /><Field label="Phone number" name="phone" type="tel" required /></div></div>
          <div className="form-section"><h3>Role details</h3><div className="form-grid"><Field label="Job title" name="job_title" required /><SelectField label="Department" name="department" options={['Engineering', 'Finance', 'Human resources', 'Operations', 'Sales']} required /><Field label="Start date" name="start_date" type="date" required /><SelectField label="Employment type" name="employment_type" options={['Full-time', 'Part-time', 'Contractor', 'Intern']} required /></div></div>
        </>}
        {activeForm === 'department' && <div className="form-section"><h3>Department details</h3><div className="form-grid"><Field label="Department name" name="name" required /><Field label="Department code" name="code" placeholder="e.g. ENG" required /><Field label="Department head" name="head" /><Field label="Cost centre" name="cost_centre" /><label className="field full-field"><span>Description</span><textarea className={inputClass} name="description" rows={4} placeholder="What does this team own?" /></label></div></div>}
        {activeForm === 'leave' && <div className="form-section"><h3>Time off details</h3><div className="form-grid"><Field label="Employee" name="employee" placeholder="Search by name" required /><SelectField label="Leave type" name="leave_type" options={['Annual leave', 'Sick leave', 'Personal leave', 'Unpaid leave']} required /><Field label="From" name="from_date" type="date" required /><Field label="To" name="to_date" type="date" required /><label className="field full-field"><span>Reason</span><textarea className={inputClass} name="reason" rows={4} placeholder="Add a short note for the approver" /></label></div></div>}
        {activeForm === 'recruitment' && <>
          <div className="form-section"><h3>Candidate profile</h3><div className="form-grid"><Field label="Candidate name" name="candidate_name" required /><Field label="Personal email" name="personal_email" type="email" required /><Field label="Phone" name="phone" type="tel" required /><Field label="Date of birth" name="date_of_birth" type="date" /><Field label="Highest qualification" name="highest_qualification" /><Field label="Year of passing" name="year_of_pass" /></div></div>
          <div className="form-section"><h3>Experience</h3><div className="form-grid"><Field label="Current employer" name="current_employer" /><Field label="Current position" name="current_position" /><Field label="Current CTC" name="current_ctc" /><label className="field full-field"><span>Role responsibilities</span><textarea className={inputClass} name="role_responsibilities" rows={4} placeholder="Summarise the candidate's current responsibilities" /></label></div></div>
        </>}
        <div className="form-actions"><button type="button" className="button secondary" onClick={() => setSubmitted(false)}>Cancel</button><button type="submit" className="button primary"><Plus size={17} /> Save {title.toLowerCase()}</button></div>
      </form>
    </section>
  )
}

function App() {
  const [activeForm, setActiveForm] = useState<FormKey>('employee')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? 'is-open' : ''}`}>
        <div className="brand"><span className="brand-mark">P</span><span>Projecto</span><button className="icon-button close-nav" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation"><X size={18} /></button></div>
        <p className="nav-label">Workspace</p>
        <nav className="side-nav"><a href="#"><LayoutDashboard size={18} /> Overview</a><a className="active" href="#forms"><FileText size={18} /> HR forms <span>4</span></a><a href="#"><Users size={18} /> Employees</a><a href="#"><CalendarDays size={18} /> Time off</a></nav>
        <div className="sidebar-bottom"><a href="#"><Settings size={18} /> Settings</a><div className="profile"><div className="avatar">AM</div><div><strong>Alex Morgan</strong><small>HR manager</small></div><ChevronRight size={16} /></div></div>
      </aside>
      {mobileNavOpen && <button className="nav-scrim" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation" />}
      <div className="content-area">
        <header className="topbar"><button className="icon-button menu-button" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Menu size={21} /></button><div className="breadcrumb"><span>Projecto</span><ChevronRight size={15} /><strong>HR forms</strong></div><div className="topbar-actions"><button className="icon-button" aria-label="Search"><Search size={19} /></button><button className="icon-button notification" aria-label="Notifications"><Bell size={19} /><i /></button><div className="top-avatar"><CircleUserRound size={23} /></div></div></header>
        <div className="page-content" id="forms"><div className="page-intro"><div><p className="eyebrow">Human resources</p><h1>Build your people directory.</h1><p className="intro-copy">Keep employee records, team structure, and requests in one considered workspace.</p></div><div className="date-card"><span>Today</span><strong>15 Sep 2026</strong></div></div>
          <div className="form-layout"><div className="form-selector"><div className="selector-head"><div><h2>Choose a form</h2><p>Start with the workflow you need.</p></div><span className="form-count">04</span></div>{formOptions.map(({ key, label, description, icon: Icon }) => <button key={key} className={`form-option ${activeForm === key ? 'selected' : ''}`} onClick={() => setActiveForm(key)}><span className="option-icon"><Icon size={19} /></span><span className="option-copy"><strong>{label}</strong><small>{description}</small></span><ChevronRight size={17} className="option-arrow" /></button>)}</div><FormPanel activeForm={activeForm} /></div>
        </div>
      </div>
    </main>
  )
}

export default App
