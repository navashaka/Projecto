import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import * as XLSX from 'xlsx'

import {
  submitUserEnquiry,
  type PreviousEmploymentPayload,
} from '../../actions/dbActions'

type UserEnquiryFormProps = {
  onBackToHR: () => void
}

type Qualification = {
  qualification: string
  institution: string
  yearOfPass: string
}

type Address = {
  streetNo: string
  streetName: string
  city: string
  state: string
  zipCode: string
  country: string
}

const enquirySchema = z.object({
  employmentType: z.string().min(1, 'Please select employment type'),
  candidateName: z.string().trim().min(2, 'Candidate name is required'),
  fatherName: z.string().trim().min(2, 'Father name is required'),
  dob: z.string().min(1, 'Date of birth is required'),
  bloodGroup: z.string().min(1, 'Please select blood group'),
  maritalStatus: z.string().min(1, 'Please select marital status'),
  religion: z.string().min(1, 'Religion is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  motherTongue: z.string().min(1, 'Mother tongue is required'),
  languagesKnown: z.string().optional(),

  streetNo: z.string().optional(),
  streetName: z.string().min(2, 'Street name is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().min(4, 'ZIP/PIN code is required'),
  country: z.string().min(2, 'Country is required'),

  phone: z.string().min(10, 'Phone number is required'),
  personalEmail: z.string().email('Enter a valid email address'),

  pan: z
    .string()
    .trim()
    .transform((value) => value.replace(/\s+/g, '').toUpperCase())
    .refine((value) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value), {
      message: 'PAN must be in the format ABCDE1234F',
    })
    .refine((value) => value[4] === 'P', {
      message: 'The 5th PAN character must be P',
    }),

  aadhar: z.string().trim().refine(
    (value) => /^[0-9]{12}$/.test(value.replace(/\s+/g, '')),
    { message: 'Aadhaar must contain exactly 12 digits' },
  ),

  passportNo: z.string().optional(),
  emergencyPhone1: z.string().min(10, 'Emergency contact is required'),
  emergencyPhone2: z.string().optional(),

  highestQualification: z.string().min(2, 'Highest qualification is required'),
  yearOfPass: z.string().min(4, 'Year of pass is required'),

  currentEmployer: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  workingPeriod: z.string().optional(),
  currentCtc: z.string().optional(),
  takeHome: z.string().optional(),
  currentResponsibilities: z.string().optional(),

  previousEmployer: z.string().optional(),
  previousPosition: z.string().optional(),
  previousDepartment: z.string().optional(),
  previousFromDate: z.string().optional(),
previousToDate: z.string().optional(),
  previousCtc: z.string().optional(),
  previousResponsibilities: z.string().optional(),
}).superRefine((data, ctx) => {
  const requiredFields =
    data.employmentType === 'Experienced'
      ? [
          ['currentEmployer', data.currentEmployer],
          ['position', data.position],
          ['department', data.department],
          ['workingPeriod', data.workingPeriod],
          ['currentCtc', data.currentCtc],
          ['currentResponsibilities', data.currentResponsibilities],
          ['previousEmployer', data.previousEmployer],
          ['previousPosition', data.previousPosition],
          ['previousDepartment', data.previousDepartment],
          ['previousFromDate', data.previousFromDate],
          ['previousToDate', data.previousToDate],
          ['previousResponsibilities', data.previousResponsibilities],
        ]
      : data.employmentType === 'Fresher'
        ? [['currentEmployer', data.currentEmployer]]
        : []

  requiredFields.forEach(([field, value]) => {
    if (!String(value ?? '').trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [String(field)],
        message: `${String(field)} is required`,
      })
    }
  })
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
  'takeHome',
  'currentResponsibilities',
  'previousEmployer',
  'previousPosition',
  'previousDepartment',
  'previousFromDate',
  'previousToDate',
  'previousCtc',
  'previousResponsibilities',
]

const emptyQualification = (): Qualification => ({
  qualification: '',
  institution: '',
  yearOfPass: '',
})

const emptyAddress = (): Address => ({
  streetNo: '',
  streetName: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'India',
})

const emptyPreviousEmployment = (): PreviousEmploymentPayload => ({
  previousEmployer: '',
  previousPosition: '',
  previousDepartment: '',
  previousWorkingPeriod: '',
  previousCtc: '',
  previousResponsibilities: '',
})

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
    setValue,
    formState: { errors },
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
      takeHome: '',
    },
  })

  const employmentType = watch('employmentType')

  const [page, setPage] = useState<'options' | 'form'>('options')
  const [shareEmail, setShareEmail] = useState('')
  const [sharePhone, setSharePhone] = useState('')
  const [qualifications, setQualifications] = useState<Qualification[]>([
    emptyQualification(),
  ])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [additionalPreviousEmployments, setAdditionalPreviousEmployments] =
    useState<PreviousEmploymentPayload[]>([])
  const [excelMessage, setExcelMessage] = useState('')
  const [excelError, setExcelError] = useState('')

  const [addressExpanded, setAddressExpanded] = useState(false)
  const [qualificationExpanded, setQualificationExpanded] = useState(false)
  const [previousEmploymentExpanded, setPreviousEmploymentExpanded] =
    useState(false)

  const addQualification = () => {
    setQualifications((current) => [...current, emptyQualification()])
    setQualificationExpanded(true)
  }

  const updateQualification = (
    index: number,
    field: keyof Qualification,
    value: string,
  ) => {
    setQualifications((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    )
  }

  const removeQualification = (index: number) =>
    setQualifications((current) => current.filter((_, i) => i !== index))

  const addAddress = () => {
    setAddresses((current) => [...current, emptyAddress()])
    setAddressExpanded(true)
  }

  const updateAddress = (
    index: number,
    field: keyof Address,
    value: string,
  ) => {
    setAddresses((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    )
  }

  const removeAddress = (index: number) =>
    setAddresses((current) => current.filter((_, i) => i !== index))

  const addPreviousCompany = () => {
    setAdditionalPreviousEmployments((current) => [
      ...current,
      emptyPreviousEmployment(),
    ])
    setPreviousEmploymentExpanded(true)
  }

  const updatePreviousCompany = (
    index: number,
    field: keyof PreviousEmploymentPayload,
    value: string,
  ) => {
    setAdditionalPreviousEmployments((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    )
  }

  const removePreviousCompany = (index: number) =>
    setAdditionalPreviousEmployments((current) =>
      current.filter((_, i) => i !== index),
    )

  const getInputClass = (field: EnquiryField) =>
    errors[field] ? 'form-control is-invalid' : 'form-control'

  const getSelectClass = (field: EnquiryField) =>
    errors[field] ? 'form-select is-invalid' : 'form-select'

  const downloadExcelTemplate = () => {
    const headers = enquiryFields
    const sampleRow = enquiryFields.map((field) => {
      const samples: Partial<Record<EnquiryField, string>> = {
        employmentType: 'Fresher',
        dob: '2000-01-01',
        country: 'India',
        state: 'Andhra Pradesh',
        city: 'Hyderabad',
        zipCode: '500001',
        streetNo: '12',
        streetName: 'Main Road',
        bloodGroup: 'O+',
        maritalStatus: 'Single',
        pan: 'ABCDE1234F',
        aadhar: '234567890123',
        personalEmail: 'candidate@example.com',
        phone: '9876543210',
        emergencyPhone1: '9876543210',
        highestQualification: 'B.Tech',
        yearOfPass: '2026',
        currentEmployer: 'Company Name',
        position: 'Software Engineer',
        department: 'IT',
        workingPeriod: '2024-Present',
        currentCtc: '300000',
        takeHome: '25000',
        currentResponsibilities: 'Describe responsibilities here',
        candidateName: 'Candidate Name',
        fatherName: 'Father Name',
        religion: 'Religion',
        nationality: 'Indian',
        motherTongue: 'Telugu',
      }

      return samples[field] ?? ''
    })

    const worksheet = XLSX.utils.aoa_to_sheet([headers, sampleRow])
    worksheet['!cols'] = headers.map(() => ({ wch: 24 }))

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidate Enquiry')
    XLSX.writeFile(workbook, 'Candidate_Enquiry_Template.xlsx')
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
        cellDates: true,
      })

      const sheetName = workbook.SheetNames[0]
      const sheet = sheetName ? workbook.Sheets[sheetName] : undefined
      if (!sheet) throw new Error('Excel worksheet not found.')

      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: '',
        raw: true,
      })

      if (rows.length < 2) {
        throw new Error('Excel file has no candidate data row.')
      }

      const headers = rows[0].map(normalizeExcelHeader)

      if (headers.some((header) => !header)) {
        throw new Error('Every Excel column must have a header.')
      }

      if (new Set(headers).size !== headers.length) {
        throw new Error('Excel file contains duplicate column headers.')
      }

      const fieldByHeader = new Map(
        enquiryFields.map((field) => [normalizeExcelHeader(field), field]),
      )

      const unsupportedHeaders = headers.filter(
        (header) => !fieldByHeader.has(header),
      )

      if (unsupportedHeaders.length) {
        throw new Error(
          `Unsupported Excel columns: ${unsupportedHeaders.join(', ')}.`,
        )
      }

      const candidateRow = rows.slice(1).find((row) =>
        row.some(
          (value) => value !== '' && value !== null && value !== undefined,
        ),
      )

      if (!candidateRow) {
        throw new Error('Excel file has no candidate data row.')
      }

      const importedValues: Partial<EnquiryFormValues> = {}

      headers.forEach((header, index) => {
        const field = fieldByHeader.get(header)
        const cell = candidateRow[index]

        if (field && cell !== '' && cell !== null && cell !== undefined) {
          importedValues[field] = excelCellToString(cell, field)
        }
      })

      if (!Object.keys(importedValues).length) {
        throw new Error(
          'The first candidate row does not contain any form values.',
        )
      }

      reset({ ...getValues(), ...importedValues })
      setExcelMessage(
        'Candidate data loaded. Review it and submit the enquiry.',
      )
    } catch (error) {
      setExcelError(
        error instanceof Error ? error.message : 'Unable to read the Excel file.',
      )
    }
  }

  const onSubmit = async (data: EnquiryFormValues) => {
    try {
      if (
        employmentType === 'Experienced' &&
        additionalPreviousEmployments.some((company) =>
          Object.values(company).some((value) => !value.trim()),
        )
      ) {
        alert(
          'Please fill all fields in additional previous employment sections.',
        )
        return
      }

      await submitUserEnquiry({
        ...data,
        qualifications,
        addresses,
        previousEmployments: additionalPreviousEmployments,
      })

      alert('Enquiry submitted successfully!')
      reset()
      setAdditionalPreviousEmployments([])
      setQualifications([emptyQualification()])
      setAddresses([])
      setAddressExpanded(false)
      setQualificationExpanded(false)
      setPreviousEmploymentExpanded(false)
      setPage('options')
    } catch (error) {
      console.error('Submit enquiry error:', error)
      alert('Something went wrong while submitting the form.')
    }
  }

  const shareLink = `${window.location.origin}/user-enquiry`

  const handleEmailShare = () => {
    if (!shareEmail.trim()) {
      alert('Please enter an email address.')
      return
    }

    window.location.href = `mailto:${encodeURIComponent(
      shareEmail,
    )}?subject=${encodeURIComponent(
      'Candidate Enquiry Form',
    )}&body=${encodeURIComponent(
      `Please fill the candidate enquiry form:\n${shareLink}`,
    )}`
  }

  const handleWhatsAppShare = () => {
    if (!sharePhone.trim()) {
      alert('Please enter a WhatsApp number.')
      return
    }

    const number = sharePhone.replace(/\D/g, '')
    const message = `Please fill the candidate enquiry form: ${shareLink}`

    window.open(
      `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  if (page === 'options') {
    return (
      <div className="enquiry-page bg-light min-vh-100 py-5">
        <div className="container">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4 p-lg-5 text-center">
              <p className="text-uppercase text-primary fw-semibold mb-1">
                Human Resources
              </p>
              <h1 className="h2 mb-4">Candidate Enquiry Form</h1>

              <div className="row g-3 justify-content-center">
                <div className="col-md-4">
                  <div className="border rounded p-4 h-100">
                    <h2 className="h5">Share via Email</h2>
                    <input
                      type="email"
                      className="form-control mb-3"
                      placeholder="Enter candidate email"
                      value={shareEmail}
                      onChange={(event) => setShareEmail(event.target.value)}
                    />
                    <button
                      className="btn btn-primary w-100"
                      onClick={handleEmailShare}
                    >
                      Share via Email
                    </button>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="border rounded p-4 h-100">
                    <h2 className="h5">Share via WhatsApp</h2>
                    <input
                      type="tel"
                      className="form-control mb-3"
                      placeholder="Enter WhatsApp number"
                      value={sharePhone}
                      onChange={(event) => setSharePhone(event.target.value)}
                    />
                    <button
                      className="btn btn-success w-100"
                      onClick={handleWhatsAppShare}
                    >
                      Share via WhatsApp
                    </button>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="border rounded p-4 h-100">
                    <h2 className="h5">Fill Here</h2>
                    <p className="text-muted">
                      Open the candidate enquiry form.
                    </p>
                    <button
                      className="btn btn-outline-primary w-100"
                      onClick={() => setPage('form')}
                    >
                      Fill Here
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-outline-secondary mt-4"
                onClick={onBackToHR}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="enquiry-page bg-light min-vh-100 py-5">
      <div className="container">
        <div className="card shadow-sm border-0">
          <div className="card-body p-4 p-lg-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <p className="text-uppercase text-primary fw-semibold mb-1">
                  Registration
                </p>
                <h1 className="h2 mb-0">Candidate Enquiry Form</h1>
              </div>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setPage('options')}
              >
                Back
              </button>
            </div>

            <form
              className="row g-3"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              {/* Personal Information */}
              <div className="col-12 border rounded bg-white p-3 p-md-4 mb-3">
                <h2 className="h4 mb-3">Personal Information</h2>

                <div className="row g-3">
                  {([
                    ['candidateName', 'Name of the candidate', 'Enter candidate full name'],
                    ['fatherName', 'Father Name', 'Enter father name'],
                    ['dob', 'Date of Birth', ''],
                    ['religion', 'Religion', 'Enter religion'],
                    ['nationality', 'Nationality', 'Enter nationality'],
                    ['motherTongue', 'Mother Tongue', 'Enter mother tongue'],
                    ['languagesKnown', 'Other languages known', 'Enter languages known'],
                  ] as const).map(([field, label, placeholder]) => (
                    <div className="col-md-6" key={field}>
                      <label className="form-label">{label}</label>
                      <input
                        type={field === 'dob' ? 'date' : 'text'}
                        placeholder={placeholder}
                        {...register(field)}
                        className={getInputClass(field)}
                      />
                      {errors[field] && (
                        <div className="invalid-feedback d-block">
                          {errors[field]?.message}
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="col-md-6">
                    <label className="form-label">Blood Group</label>
                    <select
                      {...register('bloodGroup')}
                      className={getSelectClass('bloodGroup')}
                    >
                      <option value="">Select Blood Group</option>
                      {['A+', 'A-', 'AB+', 'AB-', 'B+', 'B-', 'O+', 'O-'].map(
                        (group) => (
                          <option key={group} value={group}>
                            {group}
                          </option>
                        ),
                      )}
                    </select>
                    {errors.bloodGroup && (
                      <div className="invalid-feedback d-block">
                        {errors.bloodGroup.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Marital Status</label>
                    <select
                      {...register('maritalStatus')}
                      className={getSelectClass('maritalStatus')}
                    >
                      <option value="">Select Marital Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                    </select>
                    {errors.maritalStatus && (
                      <div className="invalid-feedback d-block">
                        {errors.maritalStatus.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Employment Type</label>
                    <select
                      {...register('employmentType')}
                      className={getSelectClass('employmentType')}
                    >
                      <option value="">Select Employment Type</option>
                      <option value="Experienced">Experienced</option>
                      <option value="Fresher">Fresher</option>
                    </select>
                    {errors.employmentType && (
                      <div className="invalid-feedback d-block">
                        {errors.employmentType.message}
                      </div>
                    )}
                  </div>

                  {([
                    ['phone', 'Phone', 'Enter phone number'],
                    ['personalEmail', 'Personal Email', 'Enter personal email'],
                    ['pan', 'PAN', 'Enter PAN number'],
                    ['aadhar', 'Aadhaar', 'Enter 12-digit Aadhaar number'],
                    ['passportNo', 'Passport No.', 'Enter passport number'],
                    ['emergencyPhone1', 'Emergency Phone 1', 'Enter emergency contact number'],
                    ['emergencyPhone2', 'Emergency Phone 2', 'Enter alternate emergency number'],
                  ] as const).map(([field, label, placeholder]) => (
                    <div className="col-md-6" key={field}>
                      <label className="form-label">{label}</label>
                      <input
                        type={field === 'personalEmail' ? 'email' : 'text'}
                        placeholder={placeholder}
                        {...register(
                          field,
                          field === 'pan'
                            ? {
                                onChange: (event) => {
                                  setValue(
                                    'pan',
                                    event.target.value.toUpperCase(),
                                    { shouldValidate: true },
                                  )
                                },
                              }
                            : {},
                        )}
                        className={getInputClass(field)}
                      />
                      {errors[field] && (
                        <div className="invalid-feedback d-block">
                          {errors[field]?.message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Address Details */}
              <div className="col-12 border rounded bg-white p-3 p-md-4 mb-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="h4 mb-0">Address Details</h2>
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={addAddress}
                  >
                    + Add Address
                  </button>
                </div>

                <div className="row g-3">
                  {([
                    ['streetNo', 'Street No', 'Enter street number'],
                    ['streetName', 'Street Name', 'Enter street name'],
                    ['city', 'City', 'Enter city'],
                    ['state', 'State', 'Enter state'],
                    ['zipCode', 'ZIP / PIN Code', 'Enter ZIP/PIN code'],
                    ['country', 'Country', 'Enter country'],
                  ] as const).map(([field, label, placeholder]) => (
                    <div className="col-md-6" key={field}>
                      <label className="form-label">{label}</label>
                      <input
                        placeholder={placeholder}
                        {...register(field)}
                        className={getInputClass(field)}
                      />
                      {errors[field] && (
                        <div className="invalid-feedback d-block">
                          {errors[field]?.message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {addresses.map((address, index) => (
                  <div key={index} className="border rounded p-3 mt-3">
                    <div className="d-flex justify-content-between mb-3">
                      <h3 className="h5">Additional Address {index + 1}</h3>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => removeAddress(index)}
                      >
                        Remove
                      </button>
                    </div>

                    {addressExpanded && (
                      <div className="row g-3">
                        {(
                          [
                            ['streetNo', 'Street No', 'Enter street number'],
                            ['streetName', 'Street Name', 'Enter street name'],
                            ['city', 'City', 'Enter city'],
                            ['state', 'State', 'Enter state'],
                            ['zipCode', 'ZIP / PIN Code', 'Enter ZIP/PIN code'],
                            ['country', 'Country', 'Enter country'],
                          ] as const
                        ).map(([field, label, placeholder]) => (
                          <div className="col-md-6" key={field}>
                            <label className="form-label">{label}</label>
                            <input
                              placeholder={placeholder}
                              value={address[field]}
                              onChange={(event) =>
                                updateAddress(index, field, event.target.value)
                              }
                              className="form-control"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Qualifications */}
              <div className="col-12 border rounded bg-white p-3 p-md-4 mb-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="h4 mb-0">Qualifications</h2>
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={addQualification}
                  >
                    + Add Qualification
                  </button>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Highest Qualification</label>
                    <input
                      placeholder="Enter highest qualification"
                      {...register('highestQualification', {
                        onChange: (e) => {
                          e.target.value = e.target.value.toUpperCase()
                        },
            })}
                      className={getInputClass('highestQualification')}
                    />
                    {errors.highestQualification && (
                      <div className="invalid-feedback d-block">
                        {errors.highestQualification.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Year of Pass</label>
                    <input
                      placeholder="Enter year of pass"
                      {...register('yearOfPass')}
                      className={getInputClass('yearOfPass')}
                    />
                    {errors.yearOfPass && (
                      <div className="invalid-feedback d-block">
                        {errors.yearOfPass.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Upload Qualification Documents (PDF)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      className="form-control"
                      multiple
                    />
                  </div>
                </div>

                {qualifications.map((qualification, index) => (
                  <div key={index} className="border rounded p-3 mt-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h3 className="h5">Qualification {index + 1}</h3>
                      {qualifications.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => removeQualification(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {qualificationExpanded && (
                      <div className="row g-3">
                        {(
                          [
                            ['qualification', 'Qualification', 'Enter qualification'],
                            ['institution', 'Institution / University', 'Enter institution or university'],
                            ['yearOfPass', 'Year of Pass', 'Enter year of pass'],
                          ] as const
                        ).map(([field, label, placeholder]) => (
                          <div className="col-md-6" key={field}>
                            <label className="form-label">{label}</label>
                            <input
                              placeholder={placeholder}
                              value={qualification[field]}
                              onChange={(event) =>
                                updateQualification(
                                  index,
                                  field,
                                  field === 'qualification'
                                    ? event.target.value.toUpperCase()
                                    : event.target.value,
                                )
                              }
                              className="form-control"
                            />
                          </div>
                        ))}

                        <div className="col-md-6">
                          <label className="form-label">Attach PDF</label>
                          <input
                            type="file"
                            accept=".pdf,application/pdf"
                            className="form-control"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Current Employment */}
              {(employmentType === 'Fresher' ||
                employmentType === 'Experienced') && (
                <div className="col-12 border rounded bg-white p-3 p-md-4 mb-3">
                  <h2 className="h4 mb-3">Current Employment</h2>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Employer</label>
                      <input
                        placeholder="Enter employer name"
                        {...register('currentEmployer')}
                        className={getInputClass('currentEmployer')}
                      />
                      {errors.currentEmployer && (
                        <div className="invalid-feedback d-block">
                          {errors.currentEmployer.message}
                        </div>
                      )}
                    </div>

                    {employmentType === 'Experienced' && (
                      <>
                        <div className="col-md-6">
                          <label className="form-label">Position</label>
                          <input
                            placeholder="Enter job position"
                            {...register('position')}
                            className={getInputClass('position')}
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">Department</label>
                          <input
                            placeholder="Enter department"
                            {...register('department')}
                            className={getInputClass('department')}
                          />
                        </div>
                      </>
                    )}

                    <div className="col-md-6">
                      <label className="form-label">Working Period - From</label>
                      <input
                        type="date"
                        {...register('workingPeriod')}
                        className={getInputClass('workingPeriod')}
                      />
                      {errors.workingPeriod && (
                        <div className="invalid-feedback d-block">
                          {errors.workingPeriod.message}
                        </div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Current CTC</label>
                      <input
                        placeholder="Enter current CTC"
                        {...register('currentCtc')}
                        className={getInputClass('currentCtc')}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Take Home</label>
                      <input
                        placeholder="Enter monthly take-home salary"
                        {...register('takeHome')}
                        className={getInputClass('takeHome')}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Upload Documents</label>
                      <input
                        type="file"
                        className="form-control"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      <small className="text-muted">
                        Appointment Letter, Payslips, 3 Months Bank Statement,
                        PF History, Others
                      </small>
                    </div>

                    <div className="col-12">
                      <label className="form-label">
                        Roles & Responsibilities
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Describe your roles and responsibilities"
                        {...register('currentResponsibilities')}
                        className="form-control"
                      />
                      {errors.currentResponsibilities && (
                        <div className="invalid-feedback d-block">
                          {errors.currentResponsibilities.message}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Previous Employment */}
              {employmentType === 'Experienced' && (
                <>
                  <div className="col-12 border rounded bg-white p-3 p-md-4 mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h2 className="h4 mb-0">Previous Employment</h2>
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={addPreviousCompany}
                      >
                        + Add
                      </button>
                    </div>

                    <div className="row g-3">
                      {(
                        [
                          ['previousEmployer', 'Previous Employer', 'Enter previous employer'],
                          ['previousPosition', 'Position', 'Enter previous position'],
                          ['previousDepartment', 'Department', 'Enter previous department'],
                          ['previousFromDate', 'From Date', 'Select from date'],
                          ['previousToDate', 'To Date', 'Select to date'],
                          ['previousCtc', 'Previous CTC', 'Enter previous CTC'],
                        ] as const
                      ).map(([field, label, placeholder]) => (
                        <div className="col-md-6" key={field}>
                          <label className="form-label">{label}</label>
                          <input
                            type={field === 'previousFromDate' || field === 'previousToDate' ? 'date' : 'text'}
                            placeholder={placeholder}
                            {...register(field)}
                            className={getInputClass(field)}
                          />
                          {errors[field] && (
                            <div className="invalid-feedback d-block">
                              {errors[field]?.message}
                            </div>
                          )}
                        </div>
                      ))}

                      <div className="col-md-6">
                        <label className="form-label">Upload Documents</label>
                        <input
                          type="file"
                          className="form-control"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                        <small className="text-muted">
                          Promotions, Increments, Achievements, Relieving
                          Letter, Appointment Letter, Others
                        </small>
                      </div>

                      <div className="col-12">
                        <label className="form-label">
                          Roles & Responsibilities
                        </label>
                        <textarea
                          rows={4}
                          placeholder="Describe previous roles and responsibilities"
                          {...register('previousResponsibilities')}
                          className="form-control"
                        />
                        {errors.previousResponsibilities && (
                          <div className="invalid-feedback d-block">
                            {errors.previousResponsibilities.message}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {additionalPreviousEmployments.map((company, index) => (
                    <div
                      key={index}
                      className="col-12 border rounded bg-white p-3 p-md-4 mb-3"
                    >
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h2 className="h4 mb-0">
                          Previous Employment {index + 2}
                        </h2>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => removePreviousCompany(index)}
                        >
                          Remove
                        </button>
                      </div>

                      {previousEmploymentExpanded && (
                        <div className="row g-3">
                          {(
                            [
                              ['previousEmployer', 'Previous Employer', 'Enter previous employer'],
                              ['previousPosition', 'Position', 'Enter previous position'],
                              ['previousDepartment', 'Department', 'Enter previous department'],
                              ['previousWorkingPeriod', 'Working Period (From - To)', 'Enter working period'],
                              ['previousCtc', 'Previous CTC', 'Enter previous CTC'],
                              ['previousResponsibilities', 'Responsibilities', 'Enter responsibilities'],
                            ] as const
                          ).map(([field, label, placeholder]) => (
                            <div
                              className={
                                field === 'previousResponsibilities'
                                  ? 'col-12'
                                  : 'col-md-6'
                              }
                              key={field}
                            >
                              <label className="form-label">{label}</label>
                              {field === 'previousResponsibilities' ? (
                                <textarea
                                  rows={4}
                                  placeholder={placeholder}
                                  value={company[field]}
                                  onChange={(event) =>
                                    updatePreviousCompany(
                                      index,
                                      field,
                                      event.target.value,
                                    )
                                  }
                                  className="form-control"
                                />
                              ) : (
                                <input
                                  placeholder={placeholder}
                                  value={company[field]}
                                  onChange={(event) =>
                                    updatePreviousCompany(
                                      index,
                                      field,
                                      event.target.value,
                                    )
                                  }
                                  className="form-control"
                                />
                              )}
                            </div>
                          ))}

                          <div className="col-md-6">
                            <label className="form-label">
                              Upload Documents
                            </label>
                            <input
                              type="file"
                              className="form-control"
                              multiple
                              accept=".pdf,.jpg,.jpeg,.png"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* Excel Upload */}
              <div className="col-12 border rounded bg-white p-3 p-md-4">
                <h2 className="h5 mb-3">Excel Upload</h2>

                <button
                  type="button"
                  className="btn btn-outline-success mb-3"
                  onClick={downloadExcelTemplate}
                >
                  Download Sample Excel Template
                </button>

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

                {excelError && (
                  <div className="text-danger mt-2" role="alert">
                    {excelError}
                  </div>
                )}

                {excelMessage && (
                  <div className="text-success mt-2" role="status">
                    {excelMessage}
                  </div>
                )}
              </div>

              <div className="col-12 d-flex justify-content-between gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-lg px-4"
                  onClick={() => setPage('options')}
                >
                  Back
                </button>

                <button type="submit" className="btn btn-primary btn-lg px-4">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserEnquiryForm