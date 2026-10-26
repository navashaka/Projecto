import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { submitUserEnquiry } from '../../actions/dbActions'

type UserEnquiryFormProps = {
  onBackToLogin?: () => void
}

const enquirySchema = z.object({
  candidateName: z.string().trim().min(2, 'Candidate name is required'),
  fatherName: z.string().optional(),
  dob: z.string().optional(),
  bloodGroup: z.string().optional(),
  maritalStatus: z.string().optional(),
  religion: z.string().optional(),
  nationality: z.string().optional(),
  motherTongue: z.string().optional(),
  languagesKnown: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  personalEmail: z.string().trim().email('Please enter a valid email address').optional().or(z.literal('')),
  pan: z
    .string()
    .trim()
    .refine(
      (value) => !value || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value.replace(/\s+/g, '').toUpperCase()),
      {
        message: 'PAN must be 10 characters in the format ABCDE1234F'
      }
    ).optional(),
  aadhar: z
    .string()
    .trim()
    .refine((value) => !value || /^[2-9][0-9]{11}$/.test(value.replace(/\s+/g, '')), {
      message: 'Aadhaar must be 12 digits and valid for Indian format'
    }).optional(),
  passportNo: z.string().optional(),
  emergencyPhone1: z.string().optional(),
  emergencyPhone2: z.string().optional(),
  highestQualification: z.string().optional(),
  additionalQualification: z.string().optional(),
  yearOfPass: z.string().optional(),
  currentEmployer: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  workingPeriod: z.string().optional(),
  currentCtc: z.string().optional(),
  currentResponsibilities: z.string().optional(),
  previousEmployer: z.string().optional(),
  previousPosition: z.string().optional(),
  previousDepartment: z.string().optional(),
  previousWorkingPeriod: z.string().optional(),
  previousCtc: z.string().optional(),
  previousResponsibilities: z.string().optional()
})

type EnquiryFormValues = z.infer<typeof enquirySchema>

type DocumentField =
  | 'highestQualificationDocument'
  | 'yearOfPassDocument'
  | 'employerDocuments'
  | 'previousEmployerDocuments'

const UserEnquiryForm = ({ onBackToLogin }: UserEnquiryFormProps) => {
  const [selectedDocuments, setSelectedDocuments] = useState<Record<DocumentField, string | undefined>>({
    highestQualificationDocument: undefined,
    yearOfPassDocument: undefined,
    employerDocuments: undefined,
    previousEmployerDocuments: undefined
  })
  const [fileInputKey, setFileInputKey] = useState(0)
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquirySchema),
    mode: 'onBlur'
  })

  const getInputClass = (fieldName: keyof EnquiryFormValues) =>
    errors[fieldName] ? 'form-control is-invalid' : 'form-control'

  const getSelectClass = (fieldName: keyof EnquiryFormValues) =>
    errors[fieldName] ? 'form-select is-invalid' : 'form-select'

  const getTextAreaClass = (fieldName: keyof EnquiryFormValues) =>
    errors[fieldName] ? 'form-control is-invalid' : 'form-control'

  const updateSelectedDocuments = (field: DocumentField, files: FileList | null) => {
    const names = Array.from(files ?? []).map((file) => file.name)
    setSelectedDocuments((current) => ({
      ...current,
      [field]: names.length > 0 ? names.join(', ') : undefined
    }))
  }

  const onSubmit = async (data: EnquiryFormValues) => {
    try {
      const qualifications = [data.highestQualification, data.additionalQualification]
        .filter((qualification): qualification is string => Boolean(qualification?.trim()))
        .join(', ')

      await submitUserEnquiry({
        ...data,
        highestQualification: qualifications || undefined,
        highestQualificationDocument: selectedDocuments.highestQualificationDocument,
        yearOfPassDocument: selectedDocuments.yearOfPassDocument,
        employerDocuments: selectedDocuments.employerDocuments,
        previousEmployerDocuments: selectedDocuments.previousEmployerDocuments
      })
      alert('Enquiry submitted successfully!')
      reset()
      setSelectedDocuments({
        highestQualificationDocument: undefined,
        yearOfPassDocument: undefined,
        employerDocuments: undefined,
        previousEmployerDocuments: undefined
      })
      setFileInputKey((current) => current + 1)
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
              {onBackToLogin && (
                <button type="button" className="btn btn-outline-secondary" onClick={onBackToLogin}>
                  Back to Login
                </button>
              )}
            </div>

            <form className="row g-3" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="col-12 border rounded bg-white p-3 p-md-4 mb-3">
                <h2 className="h4 mb-3">Personal Information</h2>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Name of the candidate</label>
                    <input
                      type="text"
                      {...register('candidateName')}
                      className={getInputClass('candidateName')}
                      placeholder="Enter full name"
                    />
                    {errors.candidateName && (
                      <div className="invalid-feedback d-block">{errors.candidateName.message}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Father Name</label>
                    <input
                      type="text"
                      {...register('fatherName')}
                      className={getInputClass('fatherName')}
                      placeholder="Enter father name"
                    />
                    {errors.fatherName && (
                      <div className="invalid-feedback d-block">{errors.fatherName.message}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Date of Birth</label>
                    <input type="date" {...register('dob')} className={getInputClass('dob')} />
                    {errors.dob && <div className="invalid-feedback d-block">{errors.dob.message}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Blood Group</label>
                    <input
                      type="text"
                      {...register('bloodGroup')}
                      className={getInputClass('bloodGroup')}
                      placeholder="O+, A-, etc."
                    />
                    {errors.bloodGroup && (
                      <div className="invalid-feedback d-block">{errors.bloodGroup.message}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Marital Status</label>
                    <select {...register('maritalStatus')} className={getSelectClass('maritalStatus')} defaultValue="">
                      <option value="" disabled>Select</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                    {errors.maritalStatus && (
                      <div className="invalid-feedback d-block">{errors.maritalStatus.message}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Religion</label>
                    <input
                      type="text"
                      {...register('religion')}
                      className={getInputClass('religion')}
                      placeholder="Religion"
                    />
                    {errors.religion && (
                      <div className="invalid-feedback d-block">{errors.religion.message}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Nationality</label>
                    <input
                      type="text"
                      {...register('nationality')}
                      className={getInputClass('nationality')}
                      placeholder="Nationality"
                    />
                    {errors.nationality && (
                      <div className="invalid-feedback d-block">{errors.nationality.message}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Mother Tongue</label>
                    <input
                      type="text"
                      {...register('motherTongue')}
                      className={getInputClass('motherTongue')}
                      placeholder="Mother tongue"
                    />
                    {errors.motherTongue && (
                      <div className="invalid-feedback d-block">{errors.motherTongue.message}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Other languages known</label>
                    <input
                      type="text"
                      {...register('languagesKnown')}
                      className="form-control"
                      placeholder="English, Hindi, etc."
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Address</label>
                    <textarea
                      rows={3}
                      {...register('address')}
                      className={getTextAreaClass('address')}
                      placeholder="Enter complete address"
                    />
                    {errors.address && (
                      <div className="invalid-feedback d-block">{errors.address.message}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      {...register('phone')}
                      className={getInputClass('phone')}
                      placeholder="+91 98765 43210"
                    />
                    {errors.phone && <div className="invalid-feedback d-block">{errors.phone.message}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Personal Email</label>
                    <input
                      type="email"
                      {...register('personalEmail')}
                      className={getInputClass('personalEmail')}
                      placeholder="name@example.com"
                    />
                    {errors.personalEmail && (
                      <div className="invalid-feedback d-block">{errors.personalEmail.message}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">PAN</label>
                    <input
                      type="text"
                      {...register('pan')}
                      className={getInputClass('pan')}
                      placeholder="ABCDE1234F"
                    />
                    {errors.pan && <div className="invalid-feedback d-block">{errors.pan.message}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Aadhar</label>
                    <input
                      type="text"
                      {...register('aadhar')}
                      className={getInputClass('aadhar')}
                      placeholder="Aadhar number"
                    />
                    {errors.aadhar && <div className="invalid-feedback d-block">{errors.aadhar.message}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Passport no.</label>
                    <input type="text" {...register('passportNo')} className="form-control" placeholder="Passport number" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Emergency Phone 1</label>
                    <input
                      type="tel"
                      {...register('emergencyPhone1')}
                      className={getInputClass('emergencyPhone1')}
                      placeholder="Emergency contact 1"
                    />
                    {errors.emergencyPhone1 && (
                      <div className="invalid-feedback d-block">{errors.emergencyPhone1.message}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Emergency Phone 2</label>
                    <input type="tel" {...register('emergencyPhone2')} className="form-control" placeholder="Emergency contact 2" />
                  </div>
                </div>
              </div>

              <div className="col-12 border rounded bg-white p-3 p-md-4 mb-3">
                <h2 className="h4 mb-3">Qualifications</h2>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Highest Qualification</label>
                    <input
                      type="text"
                      {...register('highestQualification')}
                      className={getInputClass('highestQualification')}
                      placeholder="e.g. B.E., MBA"
                    />
                    {errors.highestQualification && (
                      <div className="invalid-feedback d-block">{errors.highestQualification.message}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Year of Pass</label>
                    <input
                      type="text"
                      {...register('yearOfPass')}
                      className={getInputClass('yearOfPass')}
                      placeholder="2024"
                    />
                    {errors.yearOfPass && (
                      <div className="invalid-feedback d-block">{errors.yearOfPass.message}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Upload Certificate</label>
                    <input
                      key={`highest-qualification-${fileInputKey}`}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="form-control"
                      onChange={(event) => updateSelectedDocuments('highestQualificationDocument', event.currentTarget.files)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Upload Certificate for Year of Pass</label>
                    <input
                      key={`year-of-pass-${fileInputKey}`}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="form-control"
                      onChange={(event) => updateSelectedDocuments('yearOfPassDocument', event.currentTarget.files)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Below qualification</label>
                    <select
                      {...register('additionalQualification')}
                      className="form-select"
                      defaultValue=""
                    >
                      <option value="">Select a qualification</option>
                      <option value="Higher Secondary">Higher Secondary</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Bachelor's Degree">Bachelor&apos;s Degree</option>
                      <option value="Master's Degree">Master&apos;s Degree</option>
                      <option value="Doctorate">Doctorate</option>
                      <option value="Professional Certification">Professional Certification</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="col-12 border rounded bg-white p-3 p-md-4 mb-3">
                <h2 className="h4 mb-3">Current Employment</h2>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Current Employer</label>
                    <input
                      type="text"
                      {...register('currentEmployer')}
                      className={getInputClass('currentEmployer')}
                      placeholder="Employer name"
                    />
                    {errors.currentEmployer && (
                      <div className="invalid-feedback d-block">{errors.currentEmployer.message}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Position</label>
                    <input
                      type="text"
                      {...register('position')}
                      className={getInputClass('position')}
                      placeholder="Current position"
                    />
                    {errors.position && <div className="invalid-feedback d-block">{errors.position.message}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Department</label>
                    <input
                      type="text"
                      {...register('department')}
                      className={getInputClass('department')}
                      placeholder="Department"
                    />
                    {errors.department && (
                      <div className="invalid-feedback d-block">{errors.department.message}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Working period</label>
                    <input
                      type="text"
                      {...register('workingPeriod')}
                      className={getInputClass('workingPeriod')}
                      placeholder="e.g. 2021 - Present"
                    />
                    {errors.workingPeriod && (
                      <div className="invalid-feedback d-block">{errors.workingPeriod.message}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Current CTC</label>
                    <input
                      type="text"
                      {...register('currentCtc')}
                      className={getInputClass('currentCtc')}
                      placeholder="e.g. ₹12,00,000"
                    />
                    {errors.currentCtc && (
                      <div className="invalid-feedback d-block">{errors.currentCtc.message}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Upload Documents</label>
                    <input
                      key={`current-employer-${fileInputKey}`}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                      className="form-control"
                      onChange={(event) => updateSelectedDocuments('employerDocuments', event.currentTarget.files)}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Role, Responsibilities, Promotions &amp; Achievements</label>
                    <textarea
                      rows={4}
                      {...register('currentResponsibilities')}
                      className={getTextAreaClass('currentResponsibilities')}
                      placeholder="Describe responsibilities, promotions, achievements and milestones"
                    />
                    {errors.currentResponsibilities && (
                      <div className="invalid-feedback d-block">{errors.currentResponsibilities.message}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-12 border rounded bg-white p-3 p-md-4 mb-3">
                <h2 className="h4 mb-3">Previous Employment</h2>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Add employer</label>
                    <input
                      type="text"
                      {...register('previousEmployer')}
                      className={getInputClass('previousEmployer')}
                      placeholder="Previous employer name"
                    />
                    {errors.previousEmployer && (
                      <div className="invalid-feedback d-block">{errors.previousEmployer.message}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Position</label>
                    <input
                      type="text"
                      {...register('previousPosition')}
                      className={getInputClass('previousPosition')}
                      placeholder="Previous position"
                    />
                    {errors.previousPosition && (
                      <div className="invalid-feedback d-block">{errors.previousPosition.message}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Department</label>
                    <input
                      type="text"
                      {...register('previousDepartment')}
                      className={getInputClass('previousDepartment')}
                      placeholder="Department"
                    />
                    {errors.previousDepartment && (
                      <div className="invalid-feedback d-block">{errors.previousDepartment.message}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Working period</label>
                    <input
                      type="text"
                      {...register('previousWorkingPeriod')}
                      className={getInputClass('previousWorkingPeriod')}
                      placeholder="e.g. 2018 - 2021"
                    />
                    {errors.previousWorkingPeriod && (
                      <div className="invalid-feedback d-block">{errors.previousWorkingPeriod.message}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Current CTC</label>
                    <input
                      type="text"
                      {...register('previousCtc')}
                      className={getInputClass('previousCtc')}
                      placeholder="e.g. ₹8,00,000"
                    />
                    {errors.previousCtc && (
                      <div className="invalid-feedback d-block">{errors.previousCtc.message}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Upload Documents</label>
                    <input
                      key={`previous-employer-${fileInputKey}`}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                      className="form-control"
                      onChange={(event) => updateSelectedDocuments('previousEmployerDocuments', event.currentTarget.files)}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Role, Responsibilities, Promotions &amp; Achievements</label>
                    <textarea
                      rows={4}
                      {...register('previousResponsibilities')}
                      className={getTextAreaClass('previousResponsibilities')}
                      placeholder="Describe duties, increments, promotions, achievements"
                    />
                    {errors.previousResponsibilities && (
                      <div className="invalid-feedback d-block">{errors.previousResponsibilities.message}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-12 d-flex justify-content-end">
                <button type="submit" className="btn btn-primary btn-lg px-4">
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
