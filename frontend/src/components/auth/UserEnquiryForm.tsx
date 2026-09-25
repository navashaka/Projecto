import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { submitUserEnquiry } from '../../actions/dbActions'

type UserEnquiryFormProps = {
  onBackToLogin: () => void
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
    employmentType: z
      .string()
      .min(1, 'Please select employment type'),

    candidateName: z
      .string()
      .trim()
      .min(2, 'Candidate name is required'),

    fatherName: z
      .string()
      .trim()
      .min(2, 'Father name is required'),

    dob: z
      .string()
      .min(1, 'Date of birth is required'),

    bloodGroup: z
      .string()
      .min(1, 'Blood group is required'),

    maritalStatus: z
      .string()
      .min(1, 'Please select marital status'),

    religion: z
      .string()
      .min(1, 'Religion is required'),

    nationality: z
      .string()
      .min(1, 'Nationality is required'),

    motherTongue: z
      .string()
      .min(1, 'Mother tongue is required'),

    languagesKnown: z.string().optional(),

    address: z
      .string()
      .trim()
      .min(10, 'Address must be at least 10 characters'),

    phone: z
      .string()
      .trim()
      .min(10, 'Phone number is required'),

    personalEmail: z
      .string()
      .trim()
      .email('Please enter a valid email address'),

    pan: z
      .string()
      .trim()
      .refine(
        (value) =>
          /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(
            value.replace(/\s+/g, '').toUpperCase()
          ),
        {
          message:
            'PAN must be 10 characters in the format ABCDE1234F'
        }
      ),

    aadhar: z
      .string()
      .trim()
      .refine(
        (value) =>
          /^[2-9][0-9]{11}$/.test(
            value.replace(/\s+/g, '')
          ),
        {
          message:
            'Aadhaar must be 12 digits and valid for Indian format'
        }
      ),

    passportNo: z.string().optional(),

    emergencyPhone1: z
      .string()
      .trim()
      .min(10, 'Emergency contact is required'),

    emergencyPhone2: z.string().optional(),

    highestQualification: z
      .string()
      .trim()
      .min(2, 'Highest qualification is required'),

    yearOfPass: z
      .string()
      .trim()
      .min(4, 'Year of pass is required'),

    currentEmployer: z
      .string()
      .trim()
      .min(2, 'Current employer is required'),

    position: z
      .string()
      .trim()
      .min(2, 'Current position is required'),

    department: z
      .string()
      .trim()
      .min(2, 'Department is required'),

    workingPeriod: z
      .string()
      .trim()
      .min(2, 'Working period is required'),

    currentCtc: z
      .string()
      .trim()
      .min(2, 'Current CTC is required'),

    currentResponsibilities: z
      .string()
      .trim()
      .min(10, 'Please describe responsibilities'),

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
        {
          value: data.previousEmployer,
          path: 'previousEmployer',
          message: 'Previous employer is required'
        },
        {
          value: data.previousPosition,
          path: 'previousPosition',
          message: 'Previous position is required'
        },
        {
          value: data.previousDepartment,
          path: 'previousDepartment',
          message: 'Previous department is required'
        },
        {
          value: data.previousWorkingPeriod,
          path: 'previousWorkingPeriod',
          message: 'Previous working period is required'
        },
        {
          value: data.previousCtc,
          path: 'previousCtc',
          message: 'Previous CTC is required'
        },
        {
          value: data.previousResponsibilities,
          path: 'previousResponsibilities',
          message: 'Please provide previous role details'
        }
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

const UserEnquiryForm = ({
  onBackToLogin
}: UserEnquiryFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      employmentType: '',
      languagesKnown: '',
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

  const [
    additionalPreviousEmployments,
    setAdditionalPreviousEmployments
  ] = useState<PreviousEmployment[]>([])

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
      current.filter(
        (_, itemIndex) => itemIndex !== index
      )
    )
  }

  const updatePreviousCompany = (
    index: number,
    field: keyof PreviousEmployment,
    value: string
  ) => {
    setAdditionalPreviousEmployments((current) =>
      current.map((company, itemIndex) =>
        itemIndex === index
          ? {
              ...company,
              [field]: value
            }
          : company
      )
    )
  }

  const getInputClass = (
    fieldName: keyof EnquiryFormValues
  ) =>
    errors[fieldName]
      ? 'form-control is-invalid'
      : 'form-control'

  const getSelectClass = (
    fieldName: keyof EnquiryFormValues
  ) =>
    errors[fieldName]
      ? 'form-select is-invalid'
      : 'form-select'

  const getTextAreaClass = (
    fieldName: keyof EnquiryFormValues
  ) =>
    errors[fieldName]
      ? 'form-control is-invalid'
      : 'form-control'

  const onSubmit = async (
    data: EnquiryFormValues
  ) => {
    try {
      if (
        employmentType === 'Experienced' &&
        additionalPreviousEmployments.length > 0
      ) {
        const hasEmptyCompany =
          additionalPreviousEmployments.some(
            (company) =>
              !company.previousEmployer.trim() ||
              !company.previousPosition.trim() ||
              !company.previousDepartment.trim() ||
              !company.previousWorkingPeriod.trim() ||
              !company.previousCtc.trim() ||
              !company.previousResponsibilities.trim()
          )

        if (hasEmptyCompany) {
          alert(
            'Please fill all fields in the additional previous employment section.'
          )
          return
        }
      }

      // Send additional previous companies to backend
      await submitUserEnquiry({
        ...data,
        previousEmployments:
          additionalPreviousEmployments
      })

      alert('Enquiry submitted successfully!')

      reset()
      setAdditionalPreviousEmployments([])
    } catch (error) {
      console.error(
        'Submit enquiry error:',
        error
      )

      alert(
        'Something went wrong while submitting the form.'
      )
    }
  }

  return (
    <div className="enquiry-page bg-light min-vh-100 py-5">
      <div className="container">
        <div className="card shadow-sm border-0">
          <div className="card-body p-4 p-lg-5">

            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
              <div>
                <p className="text-uppercase text-primary fw-semibold mb-1">
                  Registration
                </p>

                <h1 className="h2 mb-0">
                  Candidate Enquiry Form
                </h1>
              </div>

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onBackToLogin}
              >
                Back to Login
              </button>
            </div>

            <form
              className="row g-3"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >

              {/* PERSONAL INFORMATION */}

              <div className="col-12 border rounded bg-white p-3 p-md-4 mb-3">
                <h2 className="h4 mb-3">
                  Personal Information
                </h2>

                <div className="row g-3">

                  <div className="col-md-6">
                    <label className="form-label">
                      Name of the candidate
                    </label>

                    <input
                      type="text"
                      {...register('candidateName')}
                      className={getInputClass(
                        'candidateName'
                      )}
                      placeholder="Enter full name"
                    />

                    {errors.candidateName && (
                      <div className="invalid-feedback d-block">
                        {errors.candidateName.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Father Name
                    </label>

                    <input
                      type="text"
                      {...register('fatherName')}
                      className={getInputClass(
                        'fatherName'
                      )}
                      placeholder="Enter father name"
                    />

                    {errors.fatherName && (
                      <div className="invalid-feedback d-block">
                        {errors.fatherName.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Date of Birth
                    </label>

                    <input
                      type="date"
                      {...register('dob')}
                      className={getInputClass('dob')}
                    />

                    {errors.dob && (
                      <div className="invalid-feedback d-block">
                        {errors.dob.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Blood Group
                    </label>

                    <select
                      {...register('bloodGroup')}
                      className={getSelectClass(
                        'bloodGroup'
                      )}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Select Blood Group
                      </option>

                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>

                    {errors.bloodGroup && (
                      <div className="invalid-feedback d-block">
                        {errors.bloodGroup.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Marital Status
                    </label>

                    <select
                      {...register('maritalStatus')}
                      className={getSelectClass(
                        'maritalStatus'
                      )}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Select
                      </option>

                      <option value="Single">
                        Single
                      </option>

                      <option value="Married">
                        Married
                      </option>

                      <option value="Divorced">
                        Divorced
                      </option>

                      <option value="Widowed">
                        Widowed
                      </option>
                    </select>

                    {errors.maritalStatus && (
                      <div className="invalid-feedback d-block">
                        {errors.maritalStatus.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Religion
                    </label>

                    <input
                      type="text"
                      {...register('religion')}
                      className={getInputClass(
                        'religion'
                      )}
                      placeholder="Religion"
                    />

                    {errors.religion && (
                      <div className="invalid-feedback d-block">
                        {errors.religion.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Nationality
                    </label>

                    <input
                      type="text"
                      {...register('nationality')}
                      className={getInputClass(
                        'nationality'
                      )}
                      placeholder="Nationality"
                    />

                    {errors.nationality && (
                      <div className="invalid-feedback d-block">
                        {errors.nationality.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Mother Tongue
                    </label>

                    <input
                      type="text"
                      {...register('motherTongue')}
                      className={getInputClass(
                        'motherTongue'
                      )}
                      placeholder="Mother tongue"
                    />

                    {errors.motherTongue && (
                      <div className="invalid-feedback d-block">
                        {errors.motherTongue.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Other languages known
                    </label>

                    <input
                      type="text"
                      {...register('languagesKnown')}
                      className="form-control"
                      placeholder="English, Hindi, etc."
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Employment Type
                    </label>

                    <select
                      {...register('employmentType')}
                      className={getSelectClass(
                        'employmentType'
                      )}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Select Employment Type
                      </option>

                      <option value="Fresher">
                        Fresher
                      </option>

                      <option value="Experienced">
                        Experienced
                      </option>
                    </select>

                    {errors.employmentType && (
                      <div className="invalid-feedback d-block">
                        {errors.employmentType.message}
                      </div>
                    )}
                  </div>

                  <div className="col-12">
                    <label className="form-label">
                      Address
                    </label>

                    <textarea
                      rows={3}
                      {...register('address')}
                      className={getTextAreaClass(
                        'address'
                      )}
                      placeholder="Enter complete address"
                    />

                    {errors.address && (
                      <div className="invalid-feedback d-block">
                        {errors.address.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Phone
                    </label>

                    <input
                      type="text"
                      {...register('phone')}
                      className={getInputClass('phone')}
                      placeholder="Phone number"
                    />

                    {errors.phone && (
                      <div className="invalid-feedback d-block">
                        {errors.phone.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Personal Email
                    </label>

                    <input
                      type="email"
                      {...register('personalEmail')}
                      className={getInputClass(
                        'personalEmail'
                      )}
                      placeholder="name@example.com"
                    />

                    {errors.personalEmail && (
                      <div className="invalid-feedback d-block">
                        {errors.personalEmail.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      PAN
                    </label>

                    <input
                      type="text"
                      {...register('pan')}
                      className={getInputClass('pan')}
                      placeholder="ABCDE1234F"
                    />

                    {errors.pan && (
                      <div className="invalid-feedback d-block">
                        {errors.pan.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Aadhar
                    </label>

                    <input
                      type="text"
                      {...register('aadhar')}
                      className={getInputClass('aadhar')}
                      placeholder="Aadhar number"
                    />

                    {errors.aadhar && (
                      <div className="invalid-feedback d-block">
                        {errors.aadhar.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Passport no.
                    </label>

                    <input
                      type="text"
                      {...register('passportNo')}
                      className="form-control"
                      placeholder="Passport number"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Emergency Phone 1
                    </label>

                    <input
                      type="text"
                      {...register('emergencyPhone1')}
                      className={getInputClass(
                        'emergencyPhone1'
                      )}
                      placeholder="Emergency contact 1"
                    />

                    {errors.emergencyPhone1 && (
                      <div className="invalid-feedback d-block">
                        {errors.emergencyPhone1.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Emergency Phone 2
                    </label>

                    <input
                      type="text"
                      {...register('emergencyPhone2')}
                      className={getInputClass(
                        'emergencyPhone2'
                      )}
                      placeholder="Emergency contact 2"
                    />

                    {errors.emergencyPhone2 && (
                      <div className="invalid-feedback d-block">
                        {errors.emergencyPhone2.message}
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* QUALIFICATIONS */}

              <div className="col-12 border rounded bg-white p-3 p-md-4 mb-3">
                <h2 className="h4 mb-3">
                  Qualifications
                </h2>

                <div className="row g-3">

                  <div className="col-md-6">
                    <label className="form-label">
                      Highest Qualification
                    </label>

                    <input
                      type="text"
                      {...register(
                        'highestQualification'
                      )}
                      className={getInputClass(
                        'highestQualification'
                      )}
                      placeholder="e.g. B.E., MBA"
                    />

                    {errors.highestQualification && (
                      <div className="invalid-feedback d-block">
                        {errors.highestQualification.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Year of Pass
                    </label>

                    <input
                      type="text"
                      {...register('yearOfPass')}
                      className={getInputClass(
                        'yearOfPass'
                      )}
                      placeholder="2026"
                    />

                    {errors.yearOfPass && (
                      <div className="invalid-feedback d-block">
                        {errors.yearOfPass.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Upload Certificate
                    </label>

                    <input
                      type="file"
                      className="form-control"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Upload Certificate
                    </label>

                    <input
                      type="file"
                      className="form-control"
                    />
                  </div>

                </div>
              </div>

              {/* CURRENT EMPLOYMENT */}

              {(employmentType === 'Fresher' ||
                employmentType === 'Experienced') && (
                <div className="col-12 border rounded bg-white p-3 p-md-4 mb-3">

                  <h2 className="h4 mb-3">
                    Current Employment
                  </h2>

                  <div className="row g-3">

                    <div className="col-md-6">
                      <label className="form-label">
                        Current Employer
                      </label>

                      <input
                        type="text"
                        {...register(
                          'currentEmployer'
                        )}
                        className={getInputClass(
                          'currentEmployer'
                        )}
                        placeholder="Employer name"
                      />

                      {errors.currentEmployer && (
                        <div className="invalid-feedback d-block">
                          {errors.currentEmployer.message}
                        </div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Position
                      </label>

                      <input
                        type="text"
                        {...register('position')}
                        className={getInputClass(
                          'position'
                        )}
                        placeholder="Current position"
                      />

                      {errors.position && (
                        <div className="invalid-feedback d-block">
                          {errors.position.message}
                        </div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Department
                      </label>

                      <input
                        type="text"
                        {...register('department')}
                        className={getInputClass(
                          'department'
                        )}
                        placeholder="Department"
                      />

                      {errors.department && (
                        <div className="invalid-feedback d-block">
                          {errors.department.message}
                        </div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Working period
                      </label>

                      <input
                        type="text"
                        {...register(
                          'workingPeriod'
                        )}
                        className={getInputClass(
                          'workingPeriod'
                        )}
                        placeholder="e.g. 2021 - Present"
                      />

                      {errors.workingPeriod && (
                        <div className="invalid-feedback d-block">
                          {errors.workingPeriod.message}
                        </div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Current CTC
                      </label>

                      <input
                        type="text"
                        {...register('currentCtc')}
                        className={getInputClass(
                          'currentCtc'
                        )}
                        placeholder="e.g. ₹12,00,000"
                      />

                      {errors.currentCtc && (
                        <div className="invalid-feedback d-block">
                          {errors.currentCtc.message}
                        </div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Upload Documents
                      </label>

                      <input
                        type="file"
                        className="form-control"
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label">
                        Role, Responsibilities,
                        Promotions &amp; Achievements
                      </label>

                      <textarea
                        rows={4}
                        {...register(
                          'currentResponsibilities'
                        )}
                        className={getTextAreaClass(
                          'currentResponsibilities'
                        )}
                        placeholder="Describe responsibilities, promotions and achievements"
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

              {/* PREVIOUS EMPLOYMENT */}

              {employmentType === 'Experienced' && (
                <>
                  <div className="col-12 border rounded bg-white p-3 p-md-4 mb-3">

                    <div className="d-flex justify-content-between align-items-center mb-3">

                      <h2 className="h4 mb-0">
                        Previous Employment
                      </h2>

                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={
                          addPreviousCompany
                        }
                      >
                        + Add
                      </button>

                    </div>

                    <div className="row g-3">

                      <div className="col-md-6">
                        <label className="form-label">
                          Previous Employer
                        </label>

                        <input
                          type="text"
                          {...register(
                            'previousEmployer'
                          )}
                          className={getInputClass(
                            'previousEmployer'
                          )}
                          placeholder="Previous employer name"
                        />

                        {errors.previousEmployer && (
                          <div className="invalid-feedback d-block">
                            {errors.previousEmployer.message}
                          </div>
                        )}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">
                          Position
                        </label>

                        <input
                          type="text"
                          {...register(
                            'previousPosition'
                          )}
                          className={getInputClass(
                            'previousPosition'
                          )}
                          placeholder="Previous position"
                        />

                        {errors.previousPosition && (
                          <div className="invalid-feedback d-block">
                            {errors.previousPosition.message}
                          </div>
                        )}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">
                          Department
                        </label>

                        <input
                          type="text"
                          {...register(
                            'previousDepartment'
                          )}
                          className={getInputClass(
                            'previousDepartment'
                          )}
                          placeholder="Department"
                        />

                        {errors.previousDepartment && (
                          <div className="invalid-feedback d-block">
                            {errors.previousDepartment.message}
                          </div>
                        )}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">
                          Working period
                        </label>

                        <input
                          type="text"
                          {...register(
                            'previousWorkingPeriod'
                          )}
                          className={getInputClass(
                            'previousWorkingPeriod'
                          )}
                          placeholder="e.g. 2018 - 2021"
                        />

                        {errors.previousWorkingPeriod && (
                          <div className="invalid-feedback d-block">
                            {errors.previousWorkingPeriod.message}
                          </div>
                        )}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">
                          Previous CTC
                        </label>

                        <input
                          type="text"
                          {...register('previousCtc')}
                          className={getInputClass(
                            'previousCtc'
                          )}
                          placeholder="e.g. ₹8,00,000"
                        />

                        {errors.previousCtc && (
                          <div className="invalid-feedback d-block">
                            {errors.previousCtc.message}
                          </div>
                        )}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">
                          Upload Documents
                        </label>

                        <input
                          type="file"
                          className="form-control"
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label">
                          Role, Responsibilities,
                          Promotions &amp; Achievements
                        </label>

                        <textarea
                          rows={4}
                          {...register(
                            'previousResponsibilities'
                          )}
                          className={getTextAreaClass(
                            'previousResponsibilities'
                          )}
                          placeholder="Describe duties, promotions and achievements"
                        />

                        {errors.previousResponsibilities && (
                          <div className="invalid-feedback d-block">
                            {errors.previousResponsibilities.message}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* ADDITIONAL PREVIOUS COMPANIES */}

                  {additionalPreviousEmployments.map(
                    (company, index) => (
                      <div
                        key={index}
                        className="col-12 border rounded bg-white p-3 p-md-4 mb-3"
                      >

                        <div className="d-flex justify-content-between align-items-center mb-3">

                          <h2 className="h4 mb-0">
                            Previous Employment{' '}
                            {index + 2}
                          </h2>

                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() =>
                              removePreviousCompany(
                                index
                              )
                            }
                          >
                            Remove
                          </button>

                        </div>

                        <div className="row g-3">

                          <div className="col-md-6">
                            <label className="form-label">
                              Previous Employer
                            </label>

                            <input
                              type="text"
                              value={
                                company.previousEmployer
                              }
                              onChange={(event) =>
                                updatePreviousCompany(
                                  index,
                                  'previousEmployer',
                                  event.target.value
                                )
                              }
                              className="form-control"
                              placeholder="Previous employer name"
                            />
                          </div>

                          <div className="col-md-6">
                            <label className="form-label">
                              Position
                            </label>

                            <input
                              type="text"
                              value={
                                company.previousPosition
                              }
                              onChange={(event) =>
                                updatePreviousCompany(
                                  index,
                                  'previousPosition',
                                  event.target.value
                                )
                              }
                              className="form-control"
                              placeholder="Previous position"
                            />
                          </div>

                          <div className="col-md-6">
                            <label className="form-label">
                              Department
                            </label>

                            <input
                              type="text"
                              value={
                                company.previousDepartment
                              }
                              onChange={(event) =>
                                updatePreviousCompany(
                                  index,
                                  'previousDepartment',
                                  event.target.value
                                )
                              }
                              className="form-control"
                              placeholder="Department"
                            />
                          </div>

                          <div className="col-md-6">
                            <label className="form-label">
                              Working period
                            </label>

                            <input
                              type="text"
                              value={
                                company.previousWorkingPeriod
                              }
                              onChange={(event) =>
                                updatePreviousCompany(
                                  index,
                                  'previousWorkingPeriod',
                                  event.target.value
                                )
                              }
                              className="form-control"
                              placeholder="e.g. 2016 - 2018"
                            />
                          </div>

                          <div className="col-md-6">
                            <label className="form-label">
                              Previous CTC
                            </label>

                            <input
                              type="text"
                              value={
                                company.previousCtc
                              }
                              onChange={(event) =>
                                updatePreviousCompany(
                                  index,
                                  'previousCtc',
                                  event.target.value
                                )
                              }
                              className="form-control"
                              placeholder="e.g. ₹6,00,000"
                            />
                          </div>

                          <div className="col-md-6">
                            <label className="form-label">
                              Upload Documents
                            </label>

                            <input
                              type="file"
                              className="form-control"
                            />
                          </div>

                          <div className="col-12">
                            <label className="form-label">
                              Role, Responsibilities,
                              Promotions &amp; Achievements
                            </label>

                            <textarea
                              rows={4}
                              value={
                                company.previousResponsibilities
                              }
                              onChange={(event) =>
                                updatePreviousCompany(
                                  index,
                                  'previousResponsibilities',
                                  event.target.value
                                )
                              }
                              className="form-control"
                              placeholder="Describe duties, promotions and achievements"
                            />
                          </div>

                        </div>
                      </div>
                    )
                  )}
                </>
              )}

              {/* SUBMIT */}

              <div className="col-12 d-flex justify-content-end">

                <button
                  type="submit"
                  className="btn btn-primary btn-lg px-4"
                >
                  Submit Enquiry
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