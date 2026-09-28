import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(
      max,
      `${label} must be ${max} characters or less`,
    )
    .optional()
    .or(z.literal(''))

const optionalDate = z
  .string()
  .refine((value) => {
    if (value === '') return true

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false
    }

    const [year, month, day] = value
      .split('-')
      .map(Number)

    const date = new Date(
      year,
      month - 1,
      day,
    )

    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    )
  }, 'Enter a valid date')
  .optional()
  .or(z.literal(''))

const employmentDetailsSchema = z.object({
  user_id: z
    .number()
    .int('User ID must be a whole number'),

  employee_code: optionalText(
    50,
    'Employee code',
  ),

  designation: optionalText(
    150,
    'Designation',
  ),

  department: optionalText(
    150,
    'Department',
  ),

  immediate_reporting_head: optionalText(
    150,
    'Immediate reporting head',
  ),

  department_head: optionalText(
    150,
    'Department head',
  ),

  location: optionalText(
    150,
    'Location',
  ),

  epf_uan: optionalText(
    50,
    'EPF UAN',
  ),

  esi: optionalText(
    50,
    'ESI',
  ),

  health_insurance: optionalText(
    150,
    'Health insurance',
  ),

  health_insurance_date: optionalDate,

  work_email: z
    .string()
    .trim()
    .max(
      150,
      'Work email must be 150 characters or less',
    )
    .email(
      'Enter a valid email address',
    )
    .optional()
    .or(z.literal('')),

  bank_account_name: optionalText(
    150,
    'Bank account name',
  ),

  account_number: optionalText(
    50,
    'Account number',
  ),

  bank: optionalText(
    150,
    'Bank',
  ),

  branch: optionalText(
    150,
    'Branch',
  ),

  ifsc: optionalText(
    20,
    'IFSC',
  ),
})

type EmploymentDetailsFormValues = z.infer<
  typeof employmentDetailsSchema
>

const CreateEmploymentDetailsPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmploymentDetailsFormValues>({
    resolver: zodResolver(
      employmentDetailsSchema,
    ),

    defaultValues: {
      user_id: undefined,
      employee_code: '',
      designation: '',
      department: '',
      immediate_reporting_head: '',
      department_head: '',
      location: '',
      epf_uan: '',
      esi: '',
      health_insurance: '',
      health_insurance_date: '',
      work_email: '',
      bank_account_name: '',
      account_number: '',
      bank: '',
      branch: '',
      ifsc: '',
    },
  })

  const onSubmit = async (
    data: EmploymentDetailsFormValues,
  ) => {
    try {
      const response = await fetch(
        'http://localhost:8000/employment/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: data.user_id,

            employee_code:
              data.employee_code || null,

            designation:
              data.designation || null,

            department:
              data.department || null,

            immediate_reporting_head:
              data.immediate_reporting_head || null,

            department_head:
              data.department_head || null,

            location:
              data.location || null,

            epf_uan:
              data.epf_uan || null,

            esi:
              data.esi || null,

            health_insurance:
              data.health_insurance || null,

            health_insurance_date:
              data.health_insurance_date || null,

            work_email:
              data.work_email || null,

            bank_account_name:
              data.bank_account_name || null,

            // Frontend field: account_number
            // Backend API field: account_no
            account_no:
              data.account_number || null,

            bank:
              data.bank || null,

            branch:
              data.branch || null,

            ifsc:
              data.ifsc || null,
          }),
        },
      )

      if (!response.ok) {
        const errorData =
          await response.json().catch(
            () => null,
          )

        throw new Error(
          errorData?.detail ||
            'Failed to save employment details',
        )
      }

      const savedData =
        await response.json()

      console.log(
        'Employment details saved:',
        savedData,
      )

      alert(
        'Employment details saved successfully!',
      )
    } catch (error) {
      console.error(
        'Employment details save error:',
        error,
      )

      alert(
        error instanceof Error
          ? error.message
          : 'Failed to save employment details',
      )
    }
  }

  const inputClass = (
    error: boolean,
  ) =>
    error
      ? 'form-control is-invalid'
      : 'form-control'

  return (
    <div className="enquiry-page bg-light min-vh-100 py-5">
      <div className="container">

        <div className="card shadow-sm border-0">
          <div className="card-body p-4 p-lg-5">

            {/* HEADER */}

            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">

              <div>
                <p className="text-uppercase text-primary fw-semibold mb-1">
                  HR
                </p>

                <h1 className="h2 mb-0">
                  Employment Details
                </h1>
              </div>

            </div>

            <form
              className="row g-3"
              onSubmit={handleSubmit(
                onSubmit,
              )}
              noValidate
            >

              {/* EMPLOYMENT INFORMATION */}

              <div className="col-12 border rounded bg-white p-3 p-md-4 mb-3">

                <h2 className="h4 mb-3">
                  Employment Information
                </h2>

                <div className="row g-3">

                  {/* USER ID */}

                  <div className="col-md-6">
                    <label className="form-label">
                      User ID
                    </label>

                    <input
                      type="number"
                      {...register(
                        'user_id',
                        {
                          valueAsNumber: true,
                        },
                      )}
                      className={inputClass(
                        !!errors.user_id,
                      )}
                      placeholder="Enter user ID"
                    />

                    {errors.user_id && (
                      <div className="invalid-feedback d-block">
                        {
                          errors.user_id
                            .message
                        }
                      </div>
                    )}
                  </div>

                  {/* EMPLOYEE CODE */}

                  <div className="col-md-6">
                    <label className="form-label">
                      Employee Code
                    </label>

                    <input
                      type="text"
                      {...register(
                        'employee_code',
                      )}
                      className={inputClass(
                        !!errors.employee_code,
                      )}
                      placeholder="Enter employee code"
                    />

                    {errors.employee_code && (
                      <div className="invalid-feedback d-block">
                        {
                          errors
                            .employee_code
                            .message
                        }
                      </div>
                    )}
                  </div>

                  {/* DESIGNATION */}

                  <div className="col-md-6">
                    <label className="form-label">
                      Designation
                    </label>

                    <input
                      type="text"
                      {...register(
                        'designation',
                      )}
                      className={inputClass(
                        !!errors.designation,
                      )}
                      placeholder="Enter designation"
                    />

                    {errors.designation && (
                      <div className="invalid-feedback d-block">
                        {
                          errors.designation
                            .message
                        }
                      </div>
                    )}
                  </div>

                  {/* DEPARTMENT */}

                  <div className="col-md-6">
                    <label className="form-label">
                      Department
                    </label>

                    <input
                      type="text"
                      {...register(
                        'department',
                      )}
                      className={inputClass(
                        !!errors.department,
                      )}
                      placeholder="Enter department"
                    />

                    {errors.department && (
                      <div className="invalid-feedback d-block">
                        {
                          errors.department
                            .message
                        }
                      </div>
                    )}
                  </div>

                  {/* IMMEDIATE REPORTING HEAD */}

                  <div className="col-md-6">
                    <label className="form-label">
                      Immediate Reporting Head
                    </label>

                    <input
                      type="text"
                      {...register(
                        'immediate_reporting_head',
                      )}
                      className={inputClass(
                        !!errors.immediate_reporting_head,
                      )}
                      placeholder="Enter immediate reporting head"
                    />

                    {errors.immediate_reporting_head && (
                      <div className="invalid-feedback d-block">
                        {
                          errors
                            .immediate_reporting_head
                            .message
                        }
                      </div>
                    )}
                  </div>

                  {/* DEPARTMENT HEAD */}

                  <div className="col-md-6">
                    <label className="form-label">
                      Department Head
                    </label>

                    <input
                      type="text"
                      {...register(
                        'department_head',
                      )}
                      className={inputClass(
                        !!errors.department_head,
                      )}
                      placeholder="Enter department head"
                    />

                    {errors.department_head && (
                      <div className="invalid-feedback d-block">
                        {
                          errors.department_head
                            .message
                        }
                      </div>
                    )}
                  </div>

                  {/* LOCATION */}

                  <div className="col-md-6">
                    <label className="form-label">
                      Location
                    </label>

                    <input
                      type="text"
                      {...register(
                        'location',
                      )}
                      className={inputClass(
                        !!errors.location,
                      )}
                      placeholder="Enter location"
                    />

                    {errors.location && (
                      <div className="invalid-feedback d-block">
                        {
                          errors.location
                            .message
                        }
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* STATUTORY & INSURANCE */}

              <div className="col-12 border rounded bg-white p-3 p-md-4 mb-3">

                <h2 className="h4 mb-3">
                  Statutory &amp; Insurance Details
                </h2>

                <div className="row g-3">

                  {/* EPF UAN */}

                  <div className="col-md-6">
                    <label className="form-label">
                      EPF UAN
                    </label>

                    <input
                      type="text"
                      {...register(
                        'epf_uan',
                      )}
                      className={inputClass(
                        !!errors.epf_uan,
                      )}
                      placeholder="Enter EPF UAN"
                    />

                    {errors.epf_uan && (
                      <div className="invalid-feedback d-block">
                        {
                          errors.epf_uan
                            .message
                        }
                      </div>
                    )}
                  </div>

                  {/* ESI */}

                  <div className="col-md-6">
                    <label className="form-label">
                      ESI
                    </label>

                    <input
                      type="text"
                      {...register(
                        'esi',
                      )}
                      className={inputClass(
                        !!errors.esi,
                      )}
                      placeholder="Enter ESI"
                    />

                    {errors.esi && (
                      <div className="invalid-feedback d-block">
                        {
                          errors.esi.message
                        }
                      </div>
                    )}
                  </div>

                  {/* HEALTH INSURANCE */}

                  <div className="col-md-6">
                    <label className="form-label">
                      Health Insurance
                    </label>

                    <input
                      type="text"
                      {...register(
                        'health_insurance',
                      )}
                      className={inputClass(
                        !!errors.health_insurance,
                      )}
                      placeholder="Enter health insurance"
                    />

                    {errors.health_insurance && (
                      <div className="invalid-feedback d-block">
                        {
                          errors
                            .health_insurance
                            .message
                        }
                      </div>
                    )}
                  </div>

                  {/* HEALTH INSURANCE DATE */}

                  <div className="col-md-6">
                    <label className="form-label">
                      Health Insurance Date
                    </label>

                    <input
                      type="date"
                      {...register(
                        'health_insurance_date',
                      )}
                      className={inputClass(
                        !!errors.health_insurance_date,
                      )}
                    />

                    {errors.health_insurance_date && (
                      <div className="invalid-feedback d-block">
                        {
                          errors
                            .health_insurance_date
                            .message
                        }
                      </div>
                    )}
                  </div>

                  {/* WORK EMAIL */}

                  <div className="col-md-6">
                    <label className="form-label">
                      Work Email
                    </label>

                    <input
                      type="email"
                      {...register(
                        'work_email',
                      )}
                      className={inputClass(
                        !!errors.work_email,
                      )}
                      placeholder="name@company.com"
                    />

                    {errors.work_email && (
                      <div className="invalid-feedback d-block">
                        {
                          errors.work_email
                            .message
                        }
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* BANK DETAILS */}

              <div className="col-12 border rounded bg-white p-3 p-md-4 mb-3">

                <h2 className="h4 mb-3">
                  Bank Details
                </h2>

                <div className="row g-3">

                  {/* BANK ACCOUNT NAME */}

                  <div className="col-md-6">
                    <label className="form-label">
                      Bank Account Name
                    </label>

                    <input
                      type="text"
                      {...register(
                        'bank_account_name',
                      )}
                      className={inputClass(
                        !!errors.bank_account_name,
                      )}
                      placeholder="Enter account holder name"
                    />

                    {errors.bank_account_name && (
                      <div className="invalid-feedback d-block">
                        {
                          errors
                            .bank_account_name
                            .message
                        }
                      </div>
                    )}
                  </div>

                  {/* ACCOUNT NUMBER */}

                  <div className="col-md-6">
                    <label className="form-label">
                      Account Number
                    </label>

                    <input
                      type="text"
                      {...register(
                        'account_number',
                      )}
                      className={inputClass(
                        !!errors.account_number,
                      )}
                      placeholder="Enter account number"
                    />

                    {errors.account_number && (
                      <div className="invalid-feedback d-block">
                        {
                          errors
                            .account_number
                            .message
                        }
                      </div>
                    )}
                  </div>

                  {/* BANK */}

                  <div className="col-md-6">
                    <label className="form-label">
                      Bank
                    </label>

                    <input
                      type="text"
                      {...register(
                        'bank',
                      )}
                      className={inputClass(
                        !!errors.bank,
                      )}
                      placeholder="Enter bank name"
                    />

                    {errors.bank && (
                      <div className="invalid-feedback d-block">
                        {
                          errors.bank
                            .message
                        }
                      </div>
                    )}
                  </div>

                  {/* BRANCH */}

                  <div className="col-md-6">
                    <label className="form-label">
                      Branch
                    </label>

                    <input
                      type="text"
                      {...register(
                        'branch',
                      )}
                      className={inputClass(
                        !!errors.branch,
                      )}
                      placeholder="Enter branch"
                    />

                    {errors.branch && (
                      <div className="invalid-feedback d-block">
                        {
                          errors.branch
                            .message
                        }
                      </div>
                    )}
                  </div>

                  {/* IFSC */}

                  <div className="col-md-6">
                    <label className="form-label">
                      IFSC
                    </label>

                    <input
                      type="text"
                      {...register(
                        'ifsc',
                      )}
                      className={inputClass(
                        !!errors.ifsc,
                      )}
                      placeholder="Enter IFSC code"
                    />

                    {errors.ifsc && (
                      <div className="invalid-feedback d-block">
                        {
                          errors.ifsc
                            .message
                        }
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* SUBMIT */}

              <div className="col-12 d-flex justify-content-end">

                <button
                  type="submit"
                  className="btn btn-primary btn-lg px-4"
                >
                  Save
                </button>

              </div>

            </form>

          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateEmploymentDetailsPage