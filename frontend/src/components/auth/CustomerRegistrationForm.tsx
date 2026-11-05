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
  streetNo: z.string().optional(),
  streetName: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  personalEmail: z.string().trim().email('Enter a valid email').optional().or(z.literal('')),
  pan: z.string().optional(),
  aadhar: z.string().optional(),
  passportNo: z.string().optional(),
  emergencyPhone1: z.string().optional(),
  emergencyPhone2: z.string().optional(),
  employmentType: z.string().optional(),
  highestQualification: z.string().optional(),
  additionalQualification: z.string().optional(),
  yearOfPass: z.string().optional(),
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
  previousWorkingPeriod: z.string().optional(),
  previousCtc: z.string().optional(),
  previousResponsibilities: z.string().optional(),
})

type EnquiryFormValues = z.infer<typeof enquirySchema>

const UserEnquiryForm = ({ onBackToLogin }: UserEnquiryFormProps) => {
  const [employmentType, setEmploymentType] = useState('')
  const [qualifications, setQualifications] = useState([''])
  const [qualificationFiles, setQualificationFiles] = useState<(File | null)[]>([null])
  const [previousEmployers, setPreviousEmployers] = useState([{ id: 1 }])
  const [previousFiles, setPreviousFiles] = useState<(File | null)[]>([])
  const [currentFiles, setCurrentFiles] = useState<File[]>([])
  const [yearFile, setYearFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquirySchema),
    mode: 'onBlur',
  })

  const inputClass = (field: keyof EnquiryFormValues) =>
    errors[field] ? 'form-control is-invalid' : 'form-control'

  const selectClass = (field: keyof EnquiryFormValues) =>
    errors[field] ? 'form-select is-invalid' : 'form-select'

  const onSubmit = async (data: EnquiryFormValues) => {
    const pan = data.pan?.replace(/\s/g, '').toUpperCase() ?? ''
    const aadhar = data.aadhar?.replace(/\D/g, '') ?? ''

    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
      alert('Enter PAN in the format ABCDE1234F.')
      return
    }

    if (aadhar && !/^[2-9][0-9]{11}$/.test(aadhar)) {
      alert('Aadhaar must contain 12 valid digits.')
      return
    }

    const qualificationText = qualifications
      .map((value) => value.trim().toUpperCase())
      .filter(Boolean)
      .join(', ')

    const fullAddress = [
      data.streetNo && `Street Number: ${data.streetNo}`,
      data.streetName && `Street Name: ${data.streetName}`,
      data.city && `City: ${data.city}`,
      data.zipCode && `ZIP/Pincode: ${data.zipCode}`,
      data.state && `State: ${data.state}`,
      data.country && `Country: ${data.country}`,
    ]
      .filter(Boolean)
      .join(', ')

    const previousEmployerText =
      previousEmployers.length > 1
        ? previousEmployers
            .map((_, index) => {
              const values = [
                (document.getElementById(`previous-employer-${index}`) as HTMLInputElement | null)?.value,
                (document.getElementById(`previous-position-${index}`) as HTMLInputElement | null)?.value,
                (document.getElementById(`previous-department-${index}`) as HTMLInputElement | null)?.value,
                (document.getElementById(`previous-period-${index}`) as HTMLInputElement | null)?.value,
                (document.getElementById(`previous-ctc-${index}`) as HTMLInputElement | null)?.value,
              ].filter(Boolean)

              return values.join(' | ')
            })
            .filter(Boolean)
            .join('\n')
        : data.previousEmployer

    try {
      await submitUserEnquiry({
        ...data,
        pan,
        aadhar,
        address: fullAddress || data.address || '',
        highestQualification: qualificationText || data.highestQualification || '',
        additionalQualification: data.additionalQualification,
        previousEmployer: previousEmployerText || '',
        employmentType,
        takeHome: data.takeHome,
        highestQualificationDocument: qualificationFiles
          .filter(Boolean)
          .map((file) => file!.name)
          .join(', '),
        yearOfPassDocument: yearFile?.name ?? '',
        employerDocuments: currentFiles.map((file) => file.name).join(', '),
        previousEmployerDocuments: previousFiles
          .filter(Boolean)
          .map((file) => file!.name)
          .join(', '),
      })

      alert('Enquiry submitted successfully!')
      reset()
      setEmploymentType('')
      setQualifications([''])
      setQualificationFiles([null])
      setPreviousEmployers([{ id: 1 }])
      setPreviousFiles([])
      setCurrentFiles([])
      setYearFile(null)
    } catch (error) {
      console.error('Submit enquiry error:', error)
      alert('Unable to submit enquiry. Please check the backend connection.')
    }
  }

  return (
    <div className="enquiry-page bg-light min-vh-100 py-0 m-0">
      <div className="container-fluid px-0 mx-0 w-100">
        <div className="card shadow-sm border-0">
          <div className="card-body p-3 p-lg-4">
            <div className="d-flex flex-column align-items-start gap-0 mb-4 w-100">
              <p className="text-uppercase text-primary fw-semibold mb-1">
                HUMAN RESOURCES
              </p>

              <h1 className="h2 mb-0">Candidate Enquiry</h1>

              {onBackToLogin && (
                <button
                  type="button"
                  className="btn btn-outline-secondary mt-3"
                  onClick={onBackToLogin}
                >
                  Back to Login
                </button>
              )}
            </div>

            <form
              className="row g-3"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              <section className="col-12 border rounded bg-white p-3 p-md-4 mb-3">
                <h2 className="h4 mb-3">Personal Information</h2>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Name of the candidate</label>
                    <input
                      {...register('candidateName')}
                      className={inputClass('candidateName')}
                    />
                    {errors.candidateName && (
                      <div className="invalid-feedback d-block">
                        {errors.candidateName.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Father Name</label>
                    <input
                      {...register('fatherName')}
                      className="form-control"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      {...register('dob')}
                      className="form-control"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Blood Group</label>
                    <select
                      {...register('bloodGroup')}
                      className={selectClass('bloodGroup')}
                      defaultValue=""
                    >
                      <option value="">Select Blood Group</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(
                        (group) => (
                          <option key={group} value={group}>
                            {group}
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Marital Status</label>
                    <select
                      {...register('maritalStatus')}
                      className={selectClass('maritalStatus')}
                      defaultValue=""
                    >
                      <option value="">Select</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Religion</label>
                    <input
                      {...register('religion')}
                      className="form-control"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Nationality</label>
                    <input
                      {...register('nationality')}
                      className="form-control"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Mother Tongue</label>
                    <input
                      {...register('motherTongue')}
                      className="form-control"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Other languages known</label>
                    <input
                      {...register('languagesKnown')}
                      className="form-control"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      {...register('phone')}
                      className="form-control"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Personal Email</label>
                    <input
                      type="email"
                      {...register('personalEmail')}
                      className={inputClass('personalEmail')}
                    />
                    {errors.personalEmail && (
                      <div className="invalid-feedback d-block">
                        {errors.personalEmail.message}
                      </div>
                    )}
                  </div>

                  <div className="col-12">
                    <h3 className="h6 mb-0">Address</h3>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Street Number</label>
                    <input
                      {...register('streetNo')}
                      className="form-control"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Street Name</label>
                    <input
                      {...register('streetName')}
                      className="form-control"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">City</label>
                    <input {...register('city')} className="form-control" />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">ZIP/Pincode</label>
                    <input
                      {...register('zipCode')}
                      className="form-control"
                      inputMode="numeric"
                      maxLength={10}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">State</label>
                    <input {...register('state')} className="form-control" />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Country</label>
                    <input {...register('country')} className="form-control" />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">PAN</label>
                    <input
                      {...register('pan')}
                      className={inputClass('pan')}
                      maxLength={10}
                      style={{ textTransform: 'uppercase' }}
                      onChange={(event) => {
                        event.target.value = event.target.value
                          .toUpperCase()
                          .replace(/\s/g, '')
                          .slice(0, 10)
                      }}
                    />
                    {errors.pan && (
                      <div className="invalid-feedback d-block">
                        {errors.pan.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Aadhaar</label>
                    <input
                      {...register('aadhar')}
                      className={inputClass('aadhar')}
                      maxLength={12}
                      inputMode="numeric"
                      onChange={(event) => {
                        event.target.value = event.target.value
                          .replace(/\D/g, '')
                          .slice(0, 12)
                      }}
                    />
                    {errors.aadhar && (
                      <div className="invalid-feedback d-block">
                        {errors.aadhar.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Passport No.</label>
                    <input
                      {...register('passportNo')}
                      className="form-control"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Emergency Phone 1</label>
                    <input
                      {...register('emergencyPhone1')}
                      className="form-control"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Emergency Phone 2</label>
                    <input
                      {...register('emergencyPhone2')}
                      className="form-control"
                    />
                  </div>
                </div>
              </section>

              <section className="col-12 border rounded bg-white p-3 p-md-4 mb-3">
                <h2 className="h4 mb-3">Employment Type</h2>

                <div className="d-flex flex-wrap gap-4">
                  {['Fresher', 'Experienced'].map((type) => (
                    <label key={type} className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="employmentType"
                        checked={employmentType === type}
                        onChange={() => setEmploymentType(type)}
                      />
                      <span className="form-check-label">{type}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="col-12 border rounded bg-white p-3 p-md-4 mb-3">
                <h2 className="h4 mb-3">Qualifications</h2>

                {qualifications.map((qualification, index) => (
                  <div
                    className="row g-3 align-items-end mb-3"
                    key={index}
                  >
                    <div className="col-md-7">
                      <label className="form-label">
                        Qualification {index + 1}
                      </label>
                      <input
                        className="form-control"
                        value={qualification}
                        style={{ textTransform: 'uppercase' }}
                        onChange={(event) => {
                          const updated = [...qualifications]
                          updated[index] = event.target.value.toUpperCase()
                          setQualifications(updated)
                        }}
                      />
                    </div>

                    <div className="col-md-5">
                      <label className="form-label">Attach PDF</label>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        className="form-control"
                        onChange={(event) => {
                          const updated = [...qualificationFiles]
                          updated[index] = event.target.files?.[0] ?? null
                          setQualificationFiles(updated)
                        }}
                      />
                    </div>

                    {index > 0 && (
                      <div className="col-12">
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => {
                            setQualifications((current) =>
                              current.filter((_, i) => i !== index),
                            )
                            setQualificationFiles((current) =>
                              current.filter((_, i) => i !== index),
                            )
                          }}
                        >
                          Remove Qualification
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => {
                    setQualifications((current) => [...current, ''])
                    setQualificationFiles((current) => [...current, null])
                  }}
                >
                  + Add Qualification
                </button>

                <div className="row g-3 mt-2">
                  <div className="col-md-6">
                    <label className="form-label">Year of Pass</label>
                    <input
                      {...register('yearOfPass')}
                      className="form-control"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Year of Pass Certificate</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="form-control"
                      onChange={(event) =>
                        setYearFile(event.target.files?.[0] ?? null)
                      }
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Additional Qualification</label>
                    <select
                      {...register('additionalQualification')}
                      className="form-select"
                      defaultValue=""
                    >
                      <option value="">Select</option>
                      <option value="Higher Secondary">Higher Secondary</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Bachelor's Degree">Bachelor's Degree</option>
                      <option value="Master's Degree">Master's Degree</option>
                      <option value="Doctorate">Doctorate</option>
                      <option value="Professional Certification">
                        Professional Certification
                      </option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </section>

              {(employmentType === 'Fresher' ||
                employmentType === 'Experienced') && (
                <section className="col-12 border rounded bg-white p-3 p-md-4 mb-3">
                  <h2 className="h4 mb-3">Current Employment</h2>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Current Employer</label>
                      <input
                        {...register('currentEmployer')}
                        className="form-control"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Position</label>
                      <input
                        {...register('position')}
                        className="form-control"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Department</label>
                      <input
                        {...register('department')}
                        className="form-control"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Working Period</label>
                      <input
                        {...register('workingPeriod')}
                        className="form-control"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Current CTC</label>
                      <input
                        {...register('currentCtc')}
                        className="form-control"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Take Home Salary</label>
                      <input
                        {...register('takeHome')}
                        className="form-control"
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label">
                        Upload Employment Documents
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        multiple
                        className="form-control"
                        onChange={(event) =>
                          setCurrentFiles(
                            Array.from(event.target.files ?? []),
                          )
                        }
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label">
                        Responsibilities, Promotions &amp; Achievements
                      </label>
                      <textarea
                        rows={4}
                        {...register('currentResponsibilities')}
                        className="form-control"
                      />
                    </div>
                  </div>
                </section>
              )}

              {employmentType === 'Experienced' && (
                <section className="col-12 border rounded bg-white p-3 p-md-4 mb-3">
                  <h2 className="h4 mb-3">Previous Employment</h2>

                  {previousEmployers.map((employer, index) => (
                    <div
                      className="row g-3 mb-4 border-bottom pb-3"
                      key={employer.id}
                    >
                      <div className="col-md-6">
                        <label className="form-label">
                          Previous Employer {index + 1}
                        </label>
                        <input
                          id={`previous-employer-${index}`}
                          className="form-control"
                          defaultValue={index === 0 ? undefined : ''}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Position</label>
                        <input
                          id={`previous-position-${index}`}
                          className="form-control"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Department</label>
                        <input
                          id={`previous-department-${index}`}
                          className="form-control"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Working Period</label>
                        <input
                          id={`previous-period-${index}`}
                          className="form-control"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">CTC</label>
                        <input
                          id={`previous-ctc-${index}`}
                          className="form-control"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Upload Documents</label>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          multiple
                          className="form-control"
                          onChange={(event) => {
                            setPreviousFiles((current) => {
                              const updated = [...current]
                              updated[index] = event.target.files?.[0] ?? null
                              return updated
                            })
                          }}
                        />
                      </div>

                      {index > 0 && (
                        <div className="col-12">
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => {
                              setPreviousEmployers((current) =>
                                current.filter(
                                  (item) => item.id !== employer.id,
                                ),
                              )
                              setPreviousFiles((current) =>
                                current.filter((_, i) => i !== index),
                              )
                            }}
                          >
                            Remove Employer
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="mb-3">
                    <label className="form-label">
                      Responsibilities, Promotions &amp; Achievements
                    </label>
                    <textarea
                      rows={3}
                      {...register('previousResponsibilities')}
                      className="form-control"
                    />
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => {
                      setPreviousEmployers((current) => [
                        ...current,
                        {
                          id:
                            Math.max(0, ...current.map((item) => item.id)) + 1,
                        },
                      ])
                    }}
                  >
                    + Add Previous Employer
                  </button>
                </section>
              )}

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