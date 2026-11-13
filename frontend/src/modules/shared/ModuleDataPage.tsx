import { Fragment, useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import {
  createHRFormRecord,
  getHREmployeeByCode,
  getHRFormRecords,
  updateHRFormRecord,
  uploadUserEnquiryFile,
  getUserEnquiries,
  submitUserEnquiry,
  updateUserEnquiry,
  type HRFormRecord,
  type UserEnquiryRecord
} from '../../actions/dbActions'
import {
  createPurchaseRecord,
  deletePurchaseRecord,
  getPurchaseRecords,
  updatePurchaseRecord,
  type PurchaseFormRecord,
  type PurchaseFormType
} from '../purchase/api'
import {
  createModuleFormRecord,
  deleteModuleFormRecord,
  getModuleFormLookups,
  getModuleFormRecords,
  getModuleFormResource,
  updateModuleFormRecord,
  uploadModuleFormFile,
  type ModuleFormLookup,
  type ModuleFormRecord
} from '../moduleFormsApi'
import ModulePageFrame from './ModulePageFrame'
import type { ModuleId, ModulePageField } from '../types'

type ModuleDataPageProps = {
  module: ModuleId
  title: string
  uppercase?: boolean
  fields: ModulePageField[]
  onSave?: (values: Record<string, string>) => Promise<unknown>
  embedded?: boolean
}

type PageRecord = {
  id: string
  values: Record<string, string>
  data?: Record<string, unknown>
}

type BudgetRow = {
  type: string
  amount: string
}

type DynamicRow = {
  id: string
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

const toSnakeCase = (value: string): string =>
  value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)

const hrFormTypes: Record<string, string> = {
  'Bank Enquiry': 'bank-enquiry',
  Attendance: 'attendance',
  Employees: 'employees',
  'Company Holidays': 'company-holidays',
  Salary: 'salary',
  Designations: 'designations',
  Payroll: 'payroll',
  Leave: 'leave',
  'On Employment': 'on-employment',
  'Travelling Advance': 'travelling-advance'
}

const purchaseFormTypes: Record<string, PurchaseFormType> = {
  Vendor: 'vendors',
  'Advance Requisition': 'advance-requisitions',
  'Quotation Comparison': 'quotation-comparisons',
  'Purchase Order': 'orders'
}

const ModuleDataPage = ({
  module,
  title,
  fields,
  onSave,
  embedded = false,
}: ModuleDataPageProps) => {
  const [records, setRecords] = useState<PageRecord[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingRecords, setIsLoadingRecords] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [lookupOptions, setLookupOptions] = useState<Record<string, ModuleFormLookup[]>>({})
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)
  const [pendingFormValues, setPendingFormValues] = useState<Record<string, string> | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const fieldsRef = useRef(fields)
  useEffect(() => {
    fieldsRef.current = fields
  }, [fields])
  const isTravellingAdvance = module === 'hr' && title === 'Travelling Advance'
  const isCandidateEnquiry = module === 'hr' && title === 'Candidate Enquiry'
  const hrFormType = module === 'hr' ? hrFormTypes[title] : undefined
  const purchaseFormType = module === 'purchase' ? purchaseFormTypes[title] : undefined
  const isHRRecordForm = Boolean(hrFormType)
  const isPurchaseRecordForm = Boolean(purchaseFormType)
  const moduleFormResource = getModuleFormResource(module, title)
  const isModuleRecordForm = Boolean(moduleFormResource)
  const canDeleteModuleRecord =
    isModuleRecordForm &&
    moduleFormResource !== 'fixed-assets' &&
    moduleFormResource !== 'tax-applicability'
  const canEditRecords = isHRRecordForm || isCandidateEnquiry || isPurchaseRecordForm || isModuleRecordForm
  const fieldIdPrefix = embedded
    ? `${module}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    : module

  const [qualificationRows, setQualificationRows] = useState<DynamicRow[]>([
    { id: crypto.randomUUID() }
  ])

  const [previousEmploymentRows, setPreviousEmploymentRows] = useState<DynamicRow[]>([
    { id: crypto.randomUUID() }
  ])

  const qualificationStart = fields.findIndex(
    (field) => field.section === 'Qualification'
  )

  const previousEmploymentStart = fields.findIndex(
    (field) => field.section === 'Previous Employment Details'
  )

  const getSectionFields = (startIndex: number) => {
    if (startIndex === -1) return []

    let endIndex = fields.length

    for (let i = startIndex + 1; i < fields.length; i++) {
      if (fields[i].section) {
        endIndex = i
        break
      }
    }

    return fields.slice(startIndex, endIndex)
  }

  const qualificationFields = getSectionFields(qualificationStart)
  const previousEmploymentFields = getSectionFields(previousEmploymentStart)

  const dynamicFieldIndexes = new Set<number>()

  if (isCandidateEnquiry && qualificationStart !== -1) {
    qualificationFields.forEach((_, index) => {
      dynamicFieldIndexes.add(qualificationStart + index)
    })
  }

  if (isCandidateEnquiry && previousEmploymentStart !== -1) {
    previousEmploymentFields.forEach((_, index) => {
      dynamicFieldIndexes.add(previousEmploymentStart + index)
    })
  }

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

  const mapCandidateEnquiryRecord = useCallback((
    item: UserEnquiryRecord,
    index: number
  ): PageRecord => {
    const values: Record<string, string> = {}

    fieldsRef.current.forEach((field) => {
      const backendKey = toSnakeCase(field.name)
      const value = item[backendKey] ?? item[field.name]

      values[field.name] =
        value === null || value === undefined ? '' : String(value)
    })

    const aliases: Record<string, string> = {
      dob: 'date_of_birth',
      email: 'personal_email',
      aadhaarNumber: 'aadhaar',
      panNumber: 'pan',
      passportNumber: 'passport_no',
      emergencyContact1: 'emergency_phone_1',
      emergencyContact2: 'emergency_phone_2',
      motherTongue: 'mother_tongue',
      otherLanguages: 'other_languages_known',
      yearOfPassing: 'year_of_pass',
      attachDocuments: 'highest_qualification_document',
      employmentType: 'employment_type',
      designation: 'current_position',
      currentCTC: 'current_ctc',
      currentResponsibilities: 'role_responsibilities',
      previousEmployer: 'previous_employer_name',
      previousDesignation: 'previous_employer_position',
      previousDepartment: 'previous_employer_department',
      previousCTC: 'previous_employer_ctc',
      previousRelievedOn: 'previous_working_to',
      previousResponsibilities: 'previous_employer_role'
    }

    Object.entries(aliases).forEach(([frontendKey, backendKey]) => {
      const value = item[backendKey]
      if (value !== null && value !== undefined) {
        values[frontendKey] = String(value)
      }
    })

    return {
      id: String(item.id ?? index),
      values,
      data: item
    }
  }, [])

  const mapHRFormRecord = useCallback((item: HRFormRecord, index: number): PageRecord => {
    const values: Record<string, string> = {}

    if (item.form_type === 'travelling-advance') {
      values.employeeCode = String(item.payload.employee_code ?? '')
      values.employeeName = String(item.payload.employee_name ?? '')
      values.placeToBeVisited = String(item.payload.place_to_be_visited ?? '')
      values.totalAdvance = String(item.payload.total_advance ?? '')
      values.totalAdvanceWords = String(item.payload.total_advance_words ?? '')
    } else {
      fieldsRef.current.forEach((field) => {
        const value = item.payload[field.name]
        values[field.name] =
          value === null || value === undefined ? '' : String(value)
      })
    }

    return {
      id: String(item.id ?? index),
      values,
      data: item.payload
    }
  }, [])

  const mapPurchaseFormRecord = useCallback((
    item: PurchaseFormRecord,
    index: number
  ): PageRecord => {
    const values: Record<string, string> = {}
    fieldsRef.current.forEach((field) => {
      const value = item.payload[field.name]
      values[field.name] =
        value === null || value === undefined ? '' : String(value)
    })
    return {
      id: String(item.id ?? index),
      values,
      data: item.payload
    }
  }, [])

  const mapModuleFormRecord = useCallback((
    item: ModuleFormRecord,
    index: number
  ): PageRecord => {
    const values: Record<string, string> = {}
    fieldsRef.current.forEach((field) => {
      const value = item.payload[field.name]
      values[field.name] =
        value === null || value === undefined ? '' : String(value)
    })
    return {
      id: String(item.id ?? index),
      values,
      data: item.payload
    }
  }, [])

  useEffect(() => {
    if (!isCandidateEnquiry && !hrFormType && !purchaseFormType && !moduleFormResource) return

    let cancelled = false
    const loadRecords = async () => {
      setIsLoadingRecords(true)
      setError('')
      try {
        if (isCandidateEnquiry) {
          const data = await getUserEnquiries()
          if (!cancelled) setRecords(data.map(mapCandidateEnquiryRecord))
        } else if (hrFormType) {
          const data = await getHRFormRecords(hrFormType)
          if (!cancelled) setRecords(data.map(mapHRFormRecord))
        } else if (purchaseFormType) {
          const data = await getPurchaseRecords(purchaseFormType)
          if (!cancelled) setRecords(data.map(mapPurchaseFormRecord))
        } else if (moduleFormResource) {
          const [data, lookups] = await Promise.all([
            getModuleFormRecords(module, moduleFormResource),
            Promise.all(
              [...new Set(fieldsRef.current.flatMap((field) => field.lookup ? [field.lookup] : []))]
                .map(async (lookup) => [lookup, await getModuleFormLookups(module, lookup)] as const)
            )
          ])
          if (!cancelled) {
            setRecords(data.map(mapModuleFormRecord))
            setLookupOptions(Object.fromEntries(lookups))
          }
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? `Unable to load ${title} records: ${error.message}`
              : `Unable to load ${title} records.`
          )
        }
      } finally {
        if (!cancelled) setIsLoadingRecords(false)
      }
    }

    void loadRecords()
    return () => {
      cancelled = true
    }
  }, [
    isCandidateEnquiry,
    hrFormType,
    purchaseFormType,
    module,
    moduleFormResource,
    title,
    mapCandidateEnquiryRecord,
    mapHRFormRecord,
    mapPurchaseFormRecord,
    mapModuleFormRecord
  ])

  useEffect(() => {
    if (!pendingFormValues || !formRef.current) return
    Object.entries(pendingFormValues).forEach(([name, value]) => {
      const input = formRef.current?.querySelector<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >(`[name="${CSS.escape(name)}"]`)
      if (input && !(input instanceof HTMLInputElement && input.type === 'file')) {
        input.value = value
      }
    })
    setPendingFormValues(null)
  }, [pendingFormValues, qualificationRows, previousEmploymentRows])

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

      const data = await getHREmployeeByCode(code.trim())
      setEmployeeName(data.employee_name ?? '')
      setDesignation(data.designation ?? '')
      setDepartment(data.department ?? '')
      setLookupMessage('Employee details loaded.')
    } catch {
      setLookupMessage('Employee details could not be loaded. Please verify the employee code and API connection.')
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
      from_date: fromDate,
      to_date: toDate,
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
      const saved = editingRecordId
        ? await updateHRFormRecord('travelling-advance', editingRecordId, payload)
        : await createHRFormRecord('travelling-advance', payload)
      const record = mapHRFormRecord(saved, records.length)
      setRecords((current) =>
        editingRecordId
          ? current.map((item) => item.id === editingRecordId ? record : item)
          : [...current, record]
      )

      setSubmitMessage(
        editingRecordId
          ? 'Travelling Advance updated successfully.'
          : 'Travelling Advance submitted successfully.'
      )
      setEditingRecordId(null)
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

  const renderDynamicField = (
    field: ModulePageField,
    rowId: string,
    sectionName: string
  ) => {
    const inputId = `${sectionName}-${rowId}-${field.name}`
    const inputName = `${sectionName}_${rowId}_${field.name}`

    return (
      <div className="col-md-6" key={inputId}>
        <label className="form-label" htmlFor={inputId}>
          {field.label}
        </label>

        {field.type === 'select' ? (
          <select
            className="form-select"
            id={inputId}
            name={inputName}
            required={field.required ?? !isCandidateEnquiry}
            defaultValue=""
          >
            <option value="" disabled>
              Select {field.label.toLowerCase()}
            </option>
            {field.lookup
              ? lookupOptions[field.lookup]?.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))
              : field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
          </select>
        ) : field.type === 'textarea' ? (
          <textarea
            className="form-control"
            id={inputId}
            name={inputName}
            required={field.required ?? !isCandidateEnquiry}
            rows={3}
          />
        ) : (
          <input
            className="form-control"
            id={inputId}
            name={inputName}
            type={field.type ?? 'text'}
            required={field.required ?? !isCandidateEnquiry}
            onChange={(e) => {
              if (field.uppercase) {
                e.currentTarget.value = e.currentTarget.value.toUpperCase()
              }
            }}
          />
        )}
      </div>
    )
  }

  const editRecord = (record: PageRecord) => {
    if (isCandidateEnquiry && record.data) {
      const pendingValues: Record<string, string> = {}
      fields.forEach((field, index) => {
        if (!dynamicFieldIndexes.has(index) && field.type !== 'file') {
          pendingValues[field.name] = record.values[field.name] ?? ''
        }
      })

      const qualificationDetails = Array.isArray(record.data.qualification_details)
        ? record.data.qualification_details
        : []
      const qualificationIds = qualificationDetails.length
        ? qualificationDetails.map(() => crypto.randomUUID())
        : [crypto.randomUUID()]
      qualificationDetails.forEach((item, index) => {
        if (typeof item !== 'object' || item === null) return
        const detail = item as Record<string, unknown>
        const rowId = qualificationIds[index]
        pendingValues[`qualification_${rowId}_highestQualification`] =
          String(detail.highest_qualification ?? '')
        pendingValues[`qualification_${rowId}_yearOfPassing`] =
          String(detail.year_of_pass ?? '')
        pendingValues[`qualification_${rowId}_attachDocuments`] =
          String(detail.document ?? '')
      })

      const employmentDetails = Array.isArray(record.data.previous_employment_details)
        ? record.data.previous_employment_details
        : []
      const employmentIds = employmentDetails.length
        ? employmentDetails.map(() => crypto.randomUUID())
        : [crypto.randomUUID()]
      employmentDetails.forEach((item, index) => {
        if (typeof item !== 'object' || item === null) return
        const detail = item as Record<string, unknown>
        const rowId = employmentIds[index]
        const detailValues: Record<string, unknown> = {
          previousEmployer: detail.employer_name,
          previousDesignation: detail.position,
          previousDepartment: detail.department,
          previousWorkingFrom: detail.working_from,
          previousRelievedOn: detail.relieved_on,
          previousCTC: detail.ctc,
          previousTakeHome: detail.take_home,
          previousResponsibilities: detail.responsibilities,
          previousEmployerDocuments: detail.documents
        }
        Object.entries(detailValues).forEach(([name, value]) => {
          pendingValues[`previousEmployment_${rowId}_${name}`] = String(value ?? '')
        })
      })

      setQualificationRows(qualificationIds.map((id) => ({ id })))
      setPreviousEmploymentRows(employmentIds.map((id) => ({ id })))
      setPendingFormValues(pendingValues)
    } else if (isTravellingAdvance && record.data) {
      const payload = record.data
      setEmployeeCode(String(payload.employee_code ?? ''))
      setEmployeeName(String(payload.employee_name ?? ''))
      setDesignation(String(payload.designation ?? ''))
      setDepartment(String(payload.department ?? ''))
      setFromDate(String(payload.from_date ?? ''))
      setToDate(String(payload.to_date ?? ''))
      setPlaceToBeVisited(String(payload.place_to_be_visited ?? ''))
      setPurpose(String(payload.purpose_of_visit ?? ''))
      setOtherExpenseType(String(payload.other_expense_type ?? ''))
      setOtherExpenseAmount(String(payload.other_expense_amount ?? ''))
      const items = Array.isArray(payload.budget_items) ? payload.budget_items : []
      const restoredBudgets = items.flatMap((item) => {
        if (typeof item !== 'object' || item === null) return []
        const detail = item as Record<string, unknown>
        return [{
          type: String(detail.type_of_budget ?? ''),
          amount: String(detail.amount ?? '')
        }]
      })
      setBudgets(restoredBudgets.length ? restoredBudgets : [{ type: '', amount: '' }])
    } else {
      const form = formRef.current
      if (!form) return
      fields.forEach((field) => {
        const input = form.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
          `[name="${field.name}"]`
        )
        if (input && !(input instanceof HTMLInputElement && input.type === 'file')) {
          input.value = record.values[field.name] ?? ''
        }
      })
    }

    setEditingRecordId(record.id)
    setError('')
    setSuccessMessage('')
    setSubmitMessage('')
  }

  const deletePurchaseRecordFromList = async (record: PageRecord) => {
    if (!purchaseFormType || !window.confirm(`Delete this ${title.toLowerCase()} record?`)) {
      return
    }

    setIsSaving(true)
    setError('')
    setSuccessMessage('')
    try {
      await deletePurchaseRecord(purchaseFormType, record.id)
      setRecords((current) => current.filter((item) => item.id !== record.id))
      if (editingRecordId === record.id) cancelEdit()
      setSuccessMessage(`${title} deleted successfully.`)
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? `Unable to delete ${title}: ${deleteError.message}`
          : `Unable to delete ${title}.`
      )
    } finally {
      setIsSaving(false)
    }
  }

  const deleteModuleRecordFromList = async (record: PageRecord) => {
    if (!moduleFormResource || !window.confirm(`Delete this ${title.toLowerCase()} record?`)) {
      return
    }

    setIsSaving(true)
    setError('')
    setSuccessMessage('')
    try {
      await deleteModuleFormRecord(module, moduleFormResource, record.id)
      setRecords((current) => current.filter((item) => item.id !== record.id))
      if (editingRecordId === record.id) cancelEdit()
      setSuccessMessage(`${title} deleted successfully.`)
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? `Unable to delete ${title}: ${deleteError.message}`
          : `Unable to delete ${title}.`
      )
    } finally {
      setIsSaving(false)
    }
  }

  const cancelEdit = () => {
    setEditingRecordId(null)
    setShowReview(false)
    setError('')
    setSuccessMessage('')
    setBudgets([{ type: '', amount: '' }])
    setEmployeeCode('')
    setEmployeeName('')
    setDesignation('')
    setDepartment('')
    setFromDate('')
    setToDate('')
    setPlaceToBeVisited('')
    setPurpose('')
    setOtherExpenseType('')
    setOtherExpenseAmount('')
    if (isCandidateEnquiry) {
      setQualificationRows([{ id: crypto.randomUUID() }])
      setPreviousEmploymentRows([{ id: crypto.randomUUID() }])
    }
    formRef.current?.reset()
  }

  const content = (
    <>
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
              {editingRecordId && (
                <button className="btn btn-secondary ms-2" type="button" onClick={cancelEdit}>
                  Cancel
                </button>
              )}
            </div>
          </form>

          {error && <div className="alert alert-danger" role="alert">{error}</div>}
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
                      {submitting ? 'Submitting...' : editingRecordId ? 'Confirm & Update' : 'Confirm & Submit'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead><tr><th>Employee Code</th><th>Employee Name</th><th>Place</th><th>Total Advance</th><th>Value in Words</th><th>Actions</th></tr></thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td className="text-center text-muted py-4" colSpan={6}>No travelling advance records have been added.</td></tr>
                ) : records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.values.employeeCode}</td>
                    <td>{record.values.employeeName}</td>
                    <td>{record.values.placeToBeVisited}</td>
                    <td>{record.values.totalAdvance}</td>
                    <td>{record.values.totalAdvanceWords}</td>
                    <td><button className="btn btn-sm btn-outline-primary" type="button" onClick={() => editRecord(record)}>Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          {onSave || isHRRecordForm || isPurchaseRecordForm || isModuleRecordForm ? (
            <div className="alert alert-info" role="status">
              {isModuleRecordForm
                ? 'This form loads and saves its records through the API.'
                : isPurchaseRecordForm
                ? `This form loads and saves its records through the Purchase API.`
                : 'This form loads and saves its records through the HR API.'}
            </div>
          ) : (
            <div className="alert alert-info" role="status">
              {isCandidateEnquiry
                ? 'Candidate Enquiry records are loaded from the database.'
                : 'Entries on this page are held in the current browser session and are not saved to the database yet.'}
            </div>
          )}

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="alert alert-success" role="status">
              {successMessage}
            </div>
          )}
          {isLoadingRecords && (
            <p className="text-muted" role="status">Loading {title.toLowerCase()} records…</p>
          )}

          <form ref={formRef} className="row g-3 mb-4" onSubmit={async (event) => {
            event.preventDefault()
            const form = event.currentTarget
            const formData = new FormData(form)
            const formValueToString = async (value: FormDataEntryValue | null) => {
              if (!(value instanceof File)) return String(value ?? '')
              if (value.size === 0) return ''
              if (isCandidateEnquiry) {
                const uploadedFile = await uploadUserEnquiryFile(value)
                return uploadedFile.path
              }
              if (module === 'gl' && moduleFormResource === 'cheque-ranges') {
                return (await uploadModuleFormFile(value)).path
              }
              return value.name
            }

            let values: Record<string, string>
            try {
              values = Object.fromEntries(
                await Promise.all(
                  Array.from(formData.entries()).map(async ([key, value]) => [
                    key,
                    await formValueToString(value)
                  ])
                )
              ) as Record<string, string>
            } catch (uploadError) {
              setError(uploadError instanceof Error ? uploadError.message : `Unable to upload ${title} attachment.`)
              return
            }

            // Collect multiple Qualification entries.
            if (isCandidateEnquiry) {
              values.qualificationDetails = JSON.stringify(
                await Promise.all(
                  qualificationRows.map(async (row) =>
                    Object.fromEntries(
                      await Promise.all(
                        qualificationFields.map(async (field) => [
                          field.name,
                          await formValueToString(
                            formData.get(`qualification_${row.id}_${field.name}`)
                          )
                        ])
                      )
                    )
                  )
                )
              )

              // Collect multiple Previous Employment entries.
              values.previousEmploymentDetails = JSON.stringify(
                await Promise.all(
                  previousEmploymentRows.map(async (row) =>
                    Object.fromEntries(
                      await Promise.all(
                        previousEmploymentFields.map(async (field) => [
                          field.name,
                          await formValueToString(
                            formData.get(`previousEmployment_${row.id}_${field.name}`)
                          )
                        ])
                      )
                    )
                  )
                )
              )
            }

            if (isCandidateEnquiry && editingRecordId) {
              const original = records.find((record) => record.id === editingRecordId)?.data
              const qualifications = Array.isArray(original?.qualification_details)
                ? original.qualification_details.map((item) =>
                    typeof item === 'object' && item !== null
                      ? item as Record<string, unknown>
                      : {}
                  )
                : []
              const previousEmployments = Array.isArray(original?.previous_employment_details)
                ? original.previous_employment_details.map((item) =>
                    typeof item === 'object' && item !== null
                      ? item as Record<string, unknown>
                      : {}
                  )
                : []

              values.attachDocuments ||= String(original?.highest_qualification_document ?? '')
              values.employerDocuments ||= String(original?.employer_documents ?? '')
              values.qualificationDetails = JSON.stringify(
                (JSON.parse(values.qualificationDetails) as Record<string, string>[]).map(
                  (detail, index) => ({
                    ...detail,
                    attachDocuments: detail.attachDocuments || String(qualifications[index]?.document ?? '')
                  })
                )
              )
              values.previousEmploymentDetails = JSON.stringify(
                (JSON.parse(values.previousEmploymentDetails) as Record<string, string>[]).map(
                  (detail, index) => ({
                    ...detail,
                    previousEmployerDocuments:
                      detail.previousEmployerDocuments || String(previousEmployments[index]?.documents ?? '')
                  })
                )
              )
            }

            setError('')
            setSuccessMessage('')
            let savedEnquiry: UserEnquiryRecord | undefined
            let savedHRForm: HRFormRecord | undefined
            let savedPurchaseForm: PurchaseFormRecord | undefined
            let savedModuleForm: ModuleFormRecord | undefined
            if (onSave || isCandidateEnquiry || hrFormType || purchaseFormType || isModuleRecordForm) {
              setIsSaving(true)
              try {
                if (isCandidateEnquiry) {
                  savedEnquiry = editingRecordId
                    ? await updateUserEnquiry(editingRecordId, values)
                    : await submitUserEnquiry(values)
                } else if (hrFormType) {
                  savedHRForm = editingRecordId
                    ? await updateHRFormRecord(hrFormType, editingRecordId, values)
                    : await createHRFormRecord(hrFormType, values)
                } else if (purchaseFormType) {
                  savedPurchaseForm = editingRecordId
                    ? await updatePurchaseRecord(purchaseFormType, editingRecordId, values)
                    : await createPurchaseRecord(purchaseFormType, values)
                } else if (moduleFormResource) {
                  savedModuleForm = editingRecordId
                    ? await updateModuleFormRecord(module, moduleFormResource, editingRecordId, values)
                    : await createModuleFormRecord(module, moduleFormResource, values)
                } else {
                  await onSave?.(values)
                }
              } catch (saveError) {
                setError(saveError instanceof Error ? saveError.message : `Unable to save ${title}.`)
                setIsSaving(false)
                return
              }
              setIsSaving(false)
            }

            if (isCandidateEnquiry && savedEnquiry) {
              const savedRecord = mapCandidateEnquiryRecord(savedEnquiry, records.length)
              setRecords((current) =>
                editingRecordId
                  ? current.map((record) =>
                      record.id === editingRecordId ? savedRecord : record
                    )
                  : [...current, savedRecord]
              )
            } else if (hrFormType && savedHRForm) {
              const savedRecord = mapHRFormRecord(savedHRForm, records.length)
              setRecords((current) =>
                editingRecordId
                  ? current.map((record) =>
                      record.id === editingRecordId ? savedRecord : record
                    )
                  : [...current, savedRecord]
              )
            } else if (purchaseFormType && savedPurchaseForm) {
              const savedRecord = mapPurchaseFormRecord(savedPurchaseForm, records.length)
              setRecords((current) =>
                editingRecordId
                  ? current.map((record) =>
                      record.id === editingRecordId ? savedRecord : record
                    )
                  : [...current, savedRecord]
              )
              setSuccessMessage(
                editingRecordId
                  ? `${title} updated successfully.`
                  : `${title} saved successfully.`
              )
            } else if (moduleFormResource && savedModuleForm) {
              const savedRecord = mapModuleFormRecord(savedModuleForm, records.length)
              setRecords((current) =>
                editingRecordId
                  ? current.map((record) =>
                      record.id === editingRecordId ? savedRecord : record
                    )
                  : [...current, savedRecord]
              )
              setSuccessMessage(
                editingRecordId
                  ? `${title} updated successfully.`
                  : `${title} saved successfully.`
              )
            } else {
              setRecords((current) => [
                ...current,
                { id: crypto.randomUUID(), values }
              ])
            }
            setEditingRecordId(null)
            form.reset()

            if (isCandidateEnquiry) {
              setQualificationRows([{ id: crypto.randomUUID() }])
              setPreviousEmploymentRows([{ id: crypto.randomUUID() }])
            }
          }}>
            {fields.map((field, index) => {
              if (dynamicFieldIndexes.has(index)) {
                if (index === qualificationStart) {
                  return (
                    <Fragment key="qualification-section">
                      <div className="col-12 mt-2">
                        <h2 className="h5 border-bottom pb-2 mb-0">
                          Qualification
                        </h2>
                      </div>

                      {qualificationRows.map((row, rowIndex) => (
                        <Fragment key={row.id}>
                          <div className="col-12">
                            <div className="d-flex justify-content-between align-items-center">
                              <strong>Qualification {rowIndex + 1}</strong>

                              {qualificationRows.length > 1 && (
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() =>
                                    setQualificationRows((current) =>
                                      current.filter((item) => item.id !== row.id)
                                    )
                                  }
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>

                          {qualificationFields.map((item) =>
                            renderDynamicField(item, row.id, 'qualification')
                          )}
                        </Fragment>
                      ))}

                      <div className="col-12">
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={() =>
                            setQualificationRows((current) => [
                              ...current,
                              { id: crypto.randomUUID() }
                            ])
                          }
                        >
                          + Add Qualification
                        </button>
                      </div>
                    </Fragment>
                  )
                }

                if (index === previousEmploymentStart) {
                  return (
                    <Fragment key="previous-employment-section">
                      <div className="col-12 mt-4">
                        <h2 className="h5 border-bottom pb-2 mb-0">
                          Previous Employment Details
                        </h2>
                      </div>

                      {previousEmploymentRows.map((row, rowIndex) => (
                        <Fragment key={row.id}>
                          <div className="col-12">
                            <div className="d-flex justify-content-between align-items-center">
                              <strong>
                                Previous Employment {rowIndex + 1}
                              </strong>

                              {previousEmploymentRows.length > 1 && (
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() =>
                                    setPreviousEmploymentRows((current) =>
                                      current.filter((item) => item.id !== row.id)
                                    )
                                  }
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>

                          {previousEmploymentFields.map((item) =>
                            renderDynamicField(
                              item,
                              row.id,
                              'previousEmployment'
                            )
                          )}
                        </Fragment>
                      ))}

                      <div className="col-12">
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={() =>
                            setPreviousEmploymentRows((current) => [
                              ...current,
                              { id: crypto.randomUUID() }
                            ])
                          }
                        >
                          + Add Previous Employment
                        </button>
                      </div>
                    </Fragment>
                  )
                }

                return null
              }

              return (
                <Fragment key={`${field.name}-${index}`}>
                  {field.section && (
                    <div className="col-12 mt-2">
                      <h2 className="h5 border-bottom pb-2 mb-0">
                        {field.section}
                      </h2>
                    </div>
                  )}

                  <div className="col-md-6">
                    <label
                      className="form-label"
                      htmlFor={`${fieldIdPrefix}-${field.name}-${index}`}
                    >
                      {field.label}
                    </label>

                    {field.type === 'select' ? (
                      <select
                        className="form-select"
                        id={`${fieldIdPrefix}-${field.name}-${index}`}
                        name={field.name}
                        required={field.required ?? !isCandidateEnquiry}
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Select {field.label.toLowerCase()}
                        </option>
                        {field.lookup
                          ? lookupOptions[field.lookup]?.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                              </option>
                            ))
                          : field.options?.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        className="form-control"
                        id={`${fieldIdPrefix}-${field.name}-${index}`}
                        name={field.name}
                        required={field.required ?? !isCandidateEnquiry}
                        rows={3}
                      />
                    ) : (
                      <input
                        className="form-control"
                        id={`${fieldIdPrefix}-${field.name}-${index}`}
                        name={field.name}
                        type={field.type ?? 'text'}
                        required={field.required ?? !isCandidateEnquiry}
                        onChange={(e) => {
                          if (field.uppercase) {
                            e.currentTarget.value = e.currentTarget.value.toUpperCase()
                          }
                        }}
                      />
                    )}
                  </div>
                </Fragment>
              )
            })}

            <div className="col-12">
              <button className="btn btn-primary" type="submit" disabled={isSaving}>
                {isSaving ? 'Sending…' : editingRecordId ? `Update ${title}` : `Add ${title}`}
              </button>
              {editingRecordId && (
                <button className="btn btn-secondary ms-2" type="button" onClick={cancelEdit}>
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead><tr>{fields.map((field, index) => <th key={`${field.name}-${index}`} scope="col">{field.label}</th>)}{canEditRecords && <th scope="col">Actions</th>}</tr></thead>
              <tbody>
                {records.length === 0 ? (
                    <tr><td className="text-center text-muted py-4" colSpan={fields.length + (canEditRecords ? 1 : 0)}>{isLoadingRecords ? `Loading ${title.toLowerCase()} records…` : `No ${title.toLowerCase()} records have been added.`}</td></tr>
                ) : records.map((record) => (
                  <tr key={record.id}>
                    {fields.map((field, index) => (
                      <td key={`${field.name}-${index}`}>
                        {field.lookup
                          ? lookupOptions[field.lookup]?.find(
                              (option) => String(option.id) === record.values[field.name]
                            )?.label ?? record.values[field.name] ?? ''
                          : record.values[field.name] ?? ''}
                      </td>
                    ))}
                    {canEditRecords && (
                      <td>
                        <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => editRecord(record)}>
                          Edit
                        </button>
                        {(isPurchaseRecordForm || canDeleteModuleRecord) && (
                          <button
                            className="btn btn-sm btn-outline-danger ms-2"
                            type="button"
                            disabled={isSaving}
                            onClick={() => void (isModuleRecordForm
                              ? deleteModuleRecordFromList(record)
                              : deletePurchaseRecordFromList(record))}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )

  return embedded
    ? content
    : <ModulePageFrame module={module} page={title}>{content}</ModulePageFrame>
}

export default ModuleDataPage