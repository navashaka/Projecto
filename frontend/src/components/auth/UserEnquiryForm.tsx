import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import * as XLSX from 'xlsx'

import { submitUserEnquiry } from '../../actions/dbActions'

type UserEnquiryFormProps = {
  onBackToHR: () => void
}

type PreviousEmployment = {
  previousEmployer: string
  previousPosition: string
  previousDepartment: string
  previousWorkingPeriod: string
  previousCtc: string
  previousResponsibilities: string
}

const enquirySchema = z
  .object({
    employmentType: z.string().min(1, 'Please select employment type'),
    candidateName: z.string().trim().min(2, 'Candidate name is required'),
    fatherName: z.string().trim().min(2, 'Father name is required'),
    dob: z.string().min(1, 'Date of birth is required'),
    bloodGroup: z.string().min(1, 'Blood group is required'),
    maritalStatus: z.string().min(1, 'Please select marital status'),
    religion: z.string().min(1, 'Religion is required'),
    nationality: z.string().min(1, 'Nationality is required'),
    motherTongue: z.string().min(1, 'Mother tongue is required'),
    languagesKnown: z.string().optional(),

    streetNo: z.string().trim().optional(),
    streetName: z.string().trim().min(2, 'Street name is required'),
    city: z.string().trim().min(2, 'City is required'),
    state: z.string().trim().min(2, 'State is required'),
    zipCode: z.string().trim().min(4, 'ZIP/PIN code is required'),
    country: z.string().trim().min(2, 'Country is required'),

    phone: z.string().trim().min(10, 'Phone number is required'),
    personalEmail: z.string().trim().email('Please enter a valid email address'),
    pan: z.string().trim().refine(
      (value) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value.replace(/\s+/g, '').toUpperCase()),
      { message: 'PAN must be 10 characters in the format ABCDE1234F' }
    ),
    aadhar: z.string().trim().refine(
      (value) => /^[2-9][0-9]{11}$/.test(value.replace(/\s+/g, '')),
      { message: 'Aadhaar must be 12 digits and valid for Indian format' }
    ),
    passportNo: z.string().optional(),
    emergencyPhone1: z.string().trim().min(10, 'Emergency contact is required'),
    emergencyPhone2: z.string().optional(),
    highestQualification: z.string().trim().min(2, 'Highest qualification is required'),
    yearOfPass: z.string().trim().min(4, 'Year of pass is required'),
    currentEmployer: z.string().trim().min(2, 'Current employer is required'),
    position: z.string().trim().min(2, 'Current position is required'),
    department: z.string().trim().min(2, 'Department is required'),
    workingPeriod: z.string().trim().min(2, 'Working period is required'),
    currentCtc: z.string().trim().min(2, 'Current CTC is required'),
    currentResponsibilities: z.string().trim().min(10, 'Please describe responsibilities'),
    previousEmployer: z.string().optional(),
    previousPosition: z.string().optional(),
    previousDepartment: z.string().optional(),
    previousWorkingPeriod: z.string().optional(),
    previousCtc: z.string().optional(),
    previousResponsibilities: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.employmentType === 'Experienced') {
      const fields = [
        { value: data.previousEmployer, path: 'previousEmployer', message: 'Previous employer is required' },
        { value: data.previousPosition, path: 'previousPosition', message: 'Previous position is required' },
        { value: data.previousDepartment, path: 'previousDepartment', message: 'Previous department is required' },
        { value: data.previousWorkingPeriod, path: 'previousWorkingPeriod', message: 'Previous working period is required' },
        { value: data.previousCtc, path: 'previousCtc', message: 'Previous CTC is required' },
        { value: data.previousResponsibilities, path: 'previousResponsibilities', message: 'Please provide previous role details' }
      ]

      fields.forEach((field) => {
        if (!field.value?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field.path],
            message: field.message
          })
        }
      })
    }
  })

type EnquiryFormValues = z.infer<typeof enquirySchema>
type EnquiryField = keyof EnquiryFormValues

const enquiryFields: EnquiryField[] = [
  'employmentType',
  'candidateName',
  'fatherName',
  'dob',
  'bloodGroup',
  'maritalStatus',
  'religion',
  'nationality',
  'motherTongue',
  'languagesKnown',
  'streetNo',
  'streetName',
  'city',
  'state',
  'zipCode',
  'country',
  'phone',
  'personalEmail',
  'pan',
  'aadhar',
  'passportNo',
  'emergencyPhone1',
  'emergencyPhone2',
  'highestQualification',
  'yearOfPass',
  'currentEmployer',
  'position',
  'department',
  'workingPeriod',
  'currentCtc',
  'currentResponsibilities',
  'previousEmployer',
  'previousPosition',
  'previousDepartment',
  'previousWorkingPeriod',
  'previousCtc',
  'previousResponsibilities'
]

function normalizeExcelHeader(value: unknown): string {
  return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}

function excelCellToString(value: unknown, field: EnquiryField): string {
  if (field === 'dob' && typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value)
    if (!date) throw new Error('Date of birth must be a valid Excel date.')
    return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    if (field === 'dob') {
      return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
    }
    return value.toISOString()
  }

  return String(value ?? '').trim()
}

const UserEnquiryForm = ({ onBackToHR }: UserEnquiryFormProps) => {
  const {
    register,
    handleSubmit,
    getValues,
    watch,
    reset,
    formState: { errors }
  } = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      employmentType: '',
      languagesKnown: '',
      streetNo: '',
      streetName: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
      passportNo: '',
      emergencyPhone2: '',
      previousEmployer: '',
      previousPosition: '',
      previousDepartment: '',
      previousWorkingPeriod: '',
      previousCtc: '',
      previousResponsibilities: ''
    }
  })

  const employmentType = watch('employmentType')

  const [additionalPreviousEmployments, setAdditionalPreviousEmployments] =
    useState<PreviousEmployment[]>([])
  const [excelMessage, setExcelMessage] = useState('')
  const [excelError, setExcelError] = useState('')

  const addPreviousCompany = () => {
    setAdditionalPreviousEmployments((current) => [
      ...current,
      {
        previousEmployer: '',
        previousPosition: '',
        previousDepartment: '',
        previousWorkingPeriod: '',
        previousCtc: '',
        previousResponsibilities: ''
      }
    ])
  }

  const removePreviousCompany = (index: number) => {
    setAdditionalPreviousEmployments((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    )
  }

  const updatePreviousCompany = (
    index: number,
    field: keyof PreviousEmployment,
    value: string
  ) => {
    setAdditionalPreviousEmployments((current) =>
      current.map((company, itemIndex) =>
        itemIndex === index ? { ...company, [field]: value } : company
      )
    )
  }

  const getInputClass = (fieldName: EnquiryField) =>
    errors[fieldName] ? 'form-control is-invalid' : 'form-control'

  const getSelectClass = (fieldName: EnquiryField) =>
    errors[fieldName] ? 'form-select is-invalid' : 'form-select'

  const getTextAreaClass = (fieldName: EnquiryField) =>
    errors[fieldName] ? 'form-control is-invalid' : 'form-control'

  const downloadExcelTemplate = () => {
    const headers = enquiryFields
    const sampleRow = enquiryFields.map((field) => {
      if (field === 'employmentType') return 'Fresher'
      if (field === 'dob') return '2000-01-01'
      if (field === 'country') return 'India'
      if (field === 'state') return 'Andhra Pradesh'
      if (field === 'city') return 'Hyderabad'
      if (field === 'zipCode') return '500001'
      if (field === 'streetNo') return '12'
      if (field === 'streetName') return 'Main Road'
      if (field === 'bloodGroup') return 'O+'
      if (field === 'maritalStatus') return 'Single'
      if (field === 'pan') return 'ABCDE1234F'
      if (field === 'aadhar') return '234567890123'
      if (field === 'personalEmail') return 'candidate@example.com'
      if (field === 'phone' || field === 'emergencyPhone1') return '9876543210'
      if (field === 'highestQualification') return 'B.Tech'
      if (field === 'yearOfPass') return '2026'
      if (field === 'currentEmployer') return 'Company Name'
      if (field === 'position') return 'Software Engineer'
      if (field === 'department') return 'IT'
      if (field === 'workingPeriod') return '2024-Present'
      if (field === 'currentCtc') return '300000'
      if (field === 'currentResponsibilities') return 'Describe your responsibilities here'
      if (field === 'candidateName') return 'Candidate Name'
      if (field === 'fatherName') return 'Father Name'
      if (field === 'religion') return 'Religion'
      if (field === 'nationality') return 'Indian'
      if (field === 'motherTongue') return 'Telugu'
      return ''
    })

    const worksheet = XLSX.utils.aoa_to_sheet([headers, sampleRow])
    worksheet['!cols'] = headers.map(() => ({ wch: 24 }))

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'User Enquiry')
    XLSX.writeFile(workbook, 'HR_User_Enquiry_Template.xlsx')
  }

  const handleExcelUpload = async (file?: File) => {
    setExcelMessage('')
    setExcelError('')
    if (!file) return

    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setExcelError('Select an Excel file (.xlsx or .xls).')
      return
    }

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), {
        type: 'array',
        cellDates: true
      })

      const sheetName = workbook.SheetNames[0]
      const sheet = sheetName ? workbook.Sheets[sheetName] : undefined
      if (!sheet) throw new Error('Excel worksheet not found.')

      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: '',
        raw: true
      })

      if (rows.length < 2) throw new Error('Excel file has no candidate data row.')

      const headers = rows[0].map(normalizeExcelHeader)
      if (headers.some((header) => !header)) {
        throw new Error('Every Excel column must have a header.')
      }
      if (new Set(headers).size !== headers.length) {
        throw new Error('Excel file contains duplicate column headers.')
      }

      const fieldByHeader = new Map(
        enquiryFields.map((field) => [normalizeExcelHeader(field), field])
      )

      const unsupportedHeaders = headers.filter((header) => !fieldByHeader.has(header))
      if (unsupportedHeaders.length) {
        throw new Error(`Unsupported Excel columns: ${unsupportedHeaders.join(', ')}.`)
      }

      const candidateRow = rows.slice(1).find((row) =>
        row.some((value) => value !== '' && value !== null && value !== undefined)
      )

      if (!candidateRow) throw new Error('Excel file has no candidate data row.')

      const importedValues: Partial<EnquiryFormValues> = {}

      headers.forEach((header, index) => {
        const field = fieldByHeader.get(header)
        const cell = candidateRow[index]

        if (field && cell !== '' && cell !== null && cell !== undefined) {
          importedValues[field] = excelCellToString(cell, field)
        }
      })

      if (Object.keys(importedValues).length === 0) {
        throw new Error('The first candidate row does not contain any form values.')
      }

      reset({ ...getValues(), ...importedValues })
      setExcelMessage('Candidate data loaded into the form. Review it and submit the enquiry.')
    } catch (error) {
      setExcelError(error instanceof Error ? error.message : 'Unable to read the Excel file.')
    }
  }

  const onSubmit = async (data: EnquiryFormValues) => {
    try {
      if (
        employmentType === 'Experienced' &&
        additionalPreviousEmployments.length > 0
      ) {
        const hasEmptyCompany = additionalPreviousEmployments.some(
          (company) =>
            !company.previousEmployer.trim() ||
            !company.previousPosition.trim() ||
            !company.previousDepartment.trim() ||
            !company.previousWorkingPeriod.trim() ||
            !company.previousCtc.trim() ||
            !company.previousResponsibilities.trim()
        )

        if (hasEmptyCompany) {
          alert('Please fill all fields in the additional previous employment section.')
          return
        }
      }

      await submitUserEnquiry({
        ...data,
        previousEmployments: additionalPreviousEmployments
      })

      alert('Enquiry submitted successfully!')
      reset()
      setAdditionalPreviousEmployments([])
    } catch (error) {
      console.error('Submit enquiry error:', error)
      alert('Something went wrong while submitting the form.')
    }
  }

  return (
    <div className="enquiry-page bg-light min-vh-100 py-5">
      <div className="container">
        <div className="card shadow-sm border-0">
          <div className="card-body p-4 p-lg-5">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
              <div>
                <p className="text-uppercase text-primary fw-semibold mb-1">Registration</p>
                <h1 className="h2 mb-0">Candidate Enquiry Form</h1>
              </div>
            </div>

            <form className="row g-3" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="col-12 border rounded bg-white p-3 p-md-4 mb-3">
                <h2 className="h4 mb-3">Personal Information</h2>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Name of the candidate</label>
                    <input {...register('candidateName')} className={getInputClass('candidateName')} placeholder="Enter full name" />
                    {errors.candidateName && <div className="invalid-feedback d-block">{errors.candidateName.message}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Father Name</label>
                    <input {...register('fatherName')} className={getInputClass('fatherName')} placeholder="Enter father name" />
                    {errors.fatherName && <div className="invalid-feedback d-block">{errors.fatherName.message}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Date of Birth</label>
                    <input type="date" {...register('dob')} className={getInputClass('dob')} />
                    {errors.dob && <div className="invalid-feedback d-block">{errors.dob.message}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Blood Group</label>
                    <select {...register('bloodGroup')} className={getSelectClass('bloodGroup')} defaultValue="">
                      <option value="" disabled>Select Blood Group</option>
                      {['A+', 'A-', 'AB+', 'AB-', 'B+', 'B-', 'O+', 'O-'].map((group) => <option key={group} value={group}>{group}</option>)}
                    </select>
                    {errors.bloodGroup && <div className="invalid-feedback d-block">{errors.bloodGroup.message}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Marital Status</label>
                    <select {...register('maritalStatus')} className={getSelectClass('maritalStatus')} defaultValue="">
                      <option value="" disabled>Select</option>
                      {['Divorced', 'Married', 'Single', 'Widowed'].map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    {errors.maritalStatus && <div className="invalid-feedback d-block">{errors.maritalStatus.message}</div>}
                  </div>

                  {([
                    ['religion', 'Religion'],
                    ['nationality', 'Nationality'],
                    ['motherTongue', 'Mother Tongue'],
                    ['languagesKnown', 'Other languages known']
                  ] as const).map(([field, label]) => (
                    <div className="col-md-6" key={field}>
                      <label className="form-label">{label}</label>
                      <input {...register(field)} className={field === 'languagesKnown' ? 'form-control' : getInputClass(field)} placeholder={label} />
                      {field !== 'languagesKnown' && errors[field] && <div className="invalid-feedback d-block">{errors[field]?.message}</div>}
                    </div>
                  ))}

                  <div className="col-md-6">
                    <label className="form-label">Employment Type</label>
                    <select {...register('employmentType')} className={getSelectClass('employmentType')} defaultValue="">
                      <option value="" disabled>Select Employment Type</option>
                      <option value="Experienced">Experienced</option>
                      <option value="Fresher">Fresher</option>
                    </select>
                    {errors.employmentType && <div className="invalid-feedback d-block">{errors.employmentType.message}</div>}
                  </div>

                  <div className="col-12">
                    <h3 className="h5 mt-2 mb-0">Address Details</h3>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Street No</label>
                    <input {...register('streetNo')} className={getInputClass('streetNo')} placeholder="Enter street number" />
                    {errors.streetNo && <div className="invalid-feedback d-block">{errors.streetNo.message}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Street Name</label>
                    <input {...register('streetName')} className={getInputClass('streetName')} placeholder="Enter street name" />
                    {errors.streetName && <div className="invalid-feedback d-block">{errors.streetName.message}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">City</label>
                    <input {...register('city')} className={getInputClass('city')} placeholder="Enter city" />
                    {errors.city && <div className="invalid-feedback d-block">{errors.city.message}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">State</label>
                    <input {...register('state')} className={getInputClass('state')} placeholder="Enter state" />
                    {errors.state && <div className="invalid-feedback d-block">{errors.state.message}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">ZIP / PIN Code</label>
                    <input {...register('zipCode')} className={getInputClass('zipCode')} placeholder="Enter ZIP/PIN code" />
                    {errors.zipCode && <div className="invalid-feedback d-block">{errors.zipCode.message}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Country</label>
                    <input {...register('country')} className={getInputClass('country')} placeholder="Enter country" />
                    {errors.country && <div className="invalid-feedback d-block">{errors.country.message}</div>}
                  </div>

                  {([
                    ['phone', 'Phone'],
                    ['personalEmail', 'Personal Email'],
                    ['pan', 'PAN'],
                    ['aadhar', 'Aadhar'],
                    ['passportNo', 'Passport no.'],
                    ['emergencyPhone1', 'Emergency Phone 1'],
                    ['emergencyPhone2', 'Emergency Phone 2']
                  ] as const).map(([field, label]) => (
                    <div className="col-md-6" key={field}>
                      <label className="form-label">{label}</label>
                      <input type={field === 'personalEmail' ? 'email' : 'text'} {...register(field)} className={getInputClass(field)} placeholder={label} />
                      {errors[field] && <div className="invalid-feedback d-block">{errors[field]?.message}</div>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-12 border rounded bg-white p-3 p-md-4 mb-3">
                <h2 className="h4 mb-3">Qualifications</h2>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Highest Qualification</label>
                    <input {...register('highestQualification')} className={getInputClass('highestQualification')} placeholder="e.g. B.E., MBA" />
                    {errors.highestQualification && <div className="invalid-feedback d-block">{errors.highestQualification.message}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Year of Pass</label>
                    <input {...register('yearOfPass')} className={getInputClass('yearOfPass')} placeholder="2026" />
                    {errors.yearOfPass && <div className="invalid-feedback d-block">{errors.yearOfPass.message}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Upload Certificate</label>
                    <input type="file" className="form-control" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Upload Certificate</label>
                    <input type="file" className="form-control" />
                  </div>
                </div>
              </div>

              {(employmentType === 'Fresher' || employmentType === 'Experienced') && (
                <div className="col-12 border rounded bg-white p-3 p-md-4 mb-3">
                  <h2 className="h4 mb-3">Current Employment</h2>
                  <div className="row g-3">
                    {([
                      ['currentEmployer', 'Current Employer'],
                      ['position', 'Position'],
                      ['department', 'Department'],
                      ['workingPeriod', 'Working period'],
                      ['currentCtc', 'Current CTC']
                    ] as const).map(([field, label]) => (
                      <div className="col-md-6" key={field}>
                        <label className="form-label">{label}</label>
                        <input {...register(field)} className={getInputClass(field)} placeholder={label} />
                        {errors[field] && <div className="invalid-feedback d-block">{errors[field]?.message}</div>}
                      </div>
                    ))}
                    <div className="col-md-6">
                      <label className="form-label">Upload Documents</label>
                      <input type="file" className="form-control" />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Role, Responsibilities, Promotions &amp; Achievements</label>
                      <textarea rows={4} {...register('currentResponsibilities')} className={getTextAreaClass('currentResponsibilities')} placeholder="Describe responsibilities, promotions and achievements" />
                      {errors.currentResponsibilities && <div className="invalid-feedback d-block">{errors.currentResponsibilities.message}</div>}
                    </div>
                  </div>
                </div>
              )}

              {employmentType === 'Experienced' && (
                <>
                  <div className="col-12 border rounded bg-white p-3 p-md-4 mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h2 className="h4 mb-0">Previous Employment</h2>
                      <button type="button" className="btn btn-outline-primary" onClick={addPreviousCompany}>+ Add</button>
                    </div>
                    <div className="row g-3">
                      {([
                        ['previousEmployer', 'Previous Employer'],
                        ['previousPosition', 'Position'],
                        ['previousDepartment', 'Department'],
                        ['previousWorkingPeriod', 'Working period'],
                        ['previousCtc', 'Previous CTC']
                      ] as const).map(([field, label]) => (
                        <div className="col-md-6" key={field}>
                          <label className="form-label">{label}</label>
                          <input {...register(field)} className={getInputClass(field)} placeholder={label} />
                          {errors[field] && <div className="invalid-feedback d-block">{errors[field]?.message}</div>}
                        </div>
                      ))}
                      <div className="col-md-6">
                        <label className="form-label">Upload Documents</label>
                        <input type="file" className="form-control" />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Role, Responsibilities, Promotions &amp; Achievements</label>
                        <textarea rows={4} {...register('previousResponsibilities')} className={getTextAreaClass('previousResponsibilities')} placeholder="Describe duties, promotions and achievements" />
                        {errors.previousResponsibilities && <div className="invalid-feedback d-block">{errors.previousResponsibilities.message}</div>}
                      </div>
                    </div>
                  </div>

                  {additionalPreviousEmployments.map((company, index) => (
                    <div key={index} className="col-12 border rounded bg-white p-3 p-md-4 mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h2 className="h4 mb-0">Previous Employment {index + 2}</h2>
                        <button type="button" className="btn btn-outline-danger" onClick={() => removePreviousCompany(index)}>Remove</button>
                      </div>
                      <div className="row g-3">
                        {([
                          ['previousEmployer', 'Previous Employer'],
                          ['previousPosition', 'Position'],
                          ['previousDepartment', 'Department'],
                          ['previousWorkingPeriod', 'Working period'],
                          ['previousCtc', 'Previous CTC'],
                          ['previousResponsibilities', 'Responsibilities']
                        ] as const).map(([field, label]) => (
                          <div className={field === 'previousResponsibilities' ? 'col-12' : 'col-md-6'} key={field}>
                            <label className="form-label">{label}</label>
                            {field === 'previousResponsibilities' ? (
                              <textarea rows={4} value={company[field]} onChange={(event) => updatePreviousCompany(index, field, event.target.value)} className="form-control" placeholder={label} />
                            ) : (
                              <input value={company[field]} onChange={(event) => updatePreviousCompany(index, field, event.target.value)} className="form-control" placeholder={label} />
                            )}
                          </div>
                        ))}
                        <div className="col-md-6">
                          <label className="form-label">Upload Documents</label>
                          <input type="file" className="form-control" />
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              <div className="col-12 border rounded bg-white p-3 p-md-4">
                <h2 className="h5 mb-3">Excel Upload</h2>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  <button type="button" className="btn btn-outline-success" onClick={downloadExcelTemplate}>
                    Download Sample Excel Template
                  </button>
                </div>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="form-control"
                  aria-label="Upload candidate details Excel file"
                  onChange={(event) => {
                    void handleExcelUpload(event.target.files?.[0])
                    event.target.value = ''
                  }}
                />
                {excelError && <div className="text-danger mt-2" role="alert">{excelError}</div>}
                {excelMessage && <div className="text-success mt-2" role="status">{excelMessage}</div>}
              </div>

              <div className="col-12 d-flex justify-content-between gap-2">
                <button type="button" className="btn btn-outline-secondary btn-lg px-4" onClick={onBackToHR}>Back</button>
                <button type="submit" className="btn btn-primary btn-lg px-4">Submit Enquiry</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserEnquiryForm