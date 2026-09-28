import { useState } from 'react'

const EmploymentDetailsForm = () => {
  const [formData, setFormData] = useState({
    employeeCode: '',
    designation: '',
    department: '',
    immediateReportingHead: '',
    departmentHead: '',
    location: '',
    epfUan: '',
    esi: '',
    healthInsurance: '',
    healthInsuranceDate: '',
    workEmail: '',
    bankAccountName: '',
    accountNumber: '',
    bank: '',
    branch: '',
    ifsc: '',
  })

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    console.log('Employment Details:', formData)
  }

  return (
    <div className="container-fluid py-4">

      {/* Page Header */}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <div
            className="text-primary fw-semibold"
            style={{ fontSize: '14px' }}
          >
            HR
          </div>

          <h1 className="h2 mb-0">
            Employment Details
          </h1>
        </div>
      </div>

      <div className="card border-0 shadow-sm">

        <div className="card-body p-4 p-md-5">

          <form
            className="row g-4"
            onSubmit={handleSubmit}
          >

            {/* Employment Information */}

            <div className="col-12">
              <h2 className="h4 mb-3">
                Employment Information
              </h2>
            </div>

            {/* Employee Code */}

            <div className="col-12 col-md-6">
              <label
                htmlFor="employeeCode"
                className="form-label"
              >
                Employee Code
              </label>

              <input
                id="employeeCode"
                name="employeeCode"
                type="text"
                className="form-control"
                placeholder="Enter employee code"
                value={formData.employeeCode}
                onChange={handleChange}
              />
            </div>

            {/* Designation */}

            <div className="col-12 col-md-6">
              <label
                htmlFor="designation"
                className="form-label"
              >
                Designation
              </label>

              <input
                id="designation"
                name="designation"
                type="text"
                className="form-control"
                placeholder="Enter designation"
                value={formData.designation}
                onChange={handleChange}
              />
            </div>

            {/* Department */}

            <div className="col-12 col-md-6">
              <label
                htmlFor="department"
                className="form-label"
              >
                Department
              </label>

              <input
                id="department"
                name="department"
                type="text"
                className="form-control"
                placeholder="Enter department"
                value={formData.department}
                onChange={handleChange}
              />
            </div>

            {/* Immediate Reporting Head */}

            <div className="col-12 col-md-6">
              <label
                htmlFor="immediateReportingHead"
                className="form-label"
              >
                Immediate Reporting Head
              </label>

              <input
                id="immediateReportingHead"
                name="immediateReportingHead"
                type="text"
                className="form-control"
                placeholder="Enter immediate reporting head"
                value={
                  formData.immediateReportingHead
                }
                onChange={handleChange}
              />
            </div>

            {/* Department Head */}

            <div className="col-12 col-md-6">
              <label
                htmlFor="departmentHead"
                className="form-label"
              >
                Department Head
              </label>

              <input
                id="departmentHead"
                name="departmentHead"
                type="text"
                className="form-control"
                placeholder="Enter department head"
                value={formData.departmentHead}
                onChange={handleChange}
              />
            </div>

            {/* Location */}

            <div className="col-12 col-md-6">
              <label
                htmlFor="location"
                className="form-label"
              >
                Location
              </label>

              <input
                id="location"
                name="location"
                type="text"
                className="form-control"
                placeholder="Enter work location"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            {/* Statutory Details */}

            <div className="col-12 mt-5">
              <h2 className="h4 mb-3">
                Statutory & Insurance Details
              </h2>
            </div>

            {/* EPF UAN */}

            <div className="col-12 col-md-6">
              <label
                htmlFor="epfUan"
                className="form-label"
              >
                EPF UAN
              </label>

              <input
                id="epfUan"
                name="epfUan"
                type="text"
                className="form-control"
                placeholder="Enter EPF UAN"
                value={formData.epfUan}
                onChange={handleChange}
              />
            </div>

            {/* ESI */}

            <div className="col-12 col-md-6">
              <label
                htmlFor="esi"
                className="form-label"
              >
                ESI
              </label>

              <input
                id="esi"
                name="esi"
                type="text"
                className="form-control"
                placeholder="Enter ESI details"
                value={formData.esi}
                onChange={handleChange}
              />
            </div>

            {/* Health Insurance */}

            <div className="col-12 col-md-6">
              <label
                htmlFor="healthInsurance"
                className="form-label"
              >
                Health Insurance
              </label>

              <input
                id="healthInsurance"
                name="healthInsurance"
                type="text"
                className="form-control"
                placeholder="Enter health insurance details"
                value={formData.healthInsurance}
                onChange={handleChange}
              />
            </div>

            {/* Health Insurance Date */}

            <div className="col-12 col-md-6">
              <label
                htmlFor="healthInsuranceDate"
                className="form-label"
              >
                Health Insurance Date
              </label>

              <input
                id="healthInsuranceDate"
                name="healthInsuranceDate"
                type="date"
                className="form-control"
                value={
                  formData.healthInsuranceDate
                }
                onChange={handleChange}
              />
            </div>

            {/* Work Email */}

            <div className="col-12 col-md-6">
              <label
                htmlFor="workEmail"
                className="form-label"
              >
                Work Email
              </label>

              <input
                id="workEmail"
                name="workEmail"
                type="email"
                className="form-control"
                placeholder="name@company.com"
                value={formData.workEmail}
                onChange={handleChange}
              />
            </div>

            {/* Bank Details */}

            <div className="col-12 mt-5">
              <h2 className="h4 mb-3">
                Bank Details
              </h2>
            </div>

            {/* Bank Account Name */}

            <div className="col-12 col-md-6">
              <label
                htmlFor="bankAccountName"
                className="form-label"
              >
                Bank Account Name
              </label>

              <input
                id="bankAccountName"
                name="bankAccountName"
                type="text"
                className="form-control"
                placeholder="Enter account holder name"
                value={formData.bankAccountName}
                onChange={handleChange}
              />
            </div>

            {/* Account Number */}

            <div className="col-12 col-md-6">
              <label
                htmlFor="accountNumber"
                className="form-label"
              >
                Account Number
              </label>

              <input
                id="accountNumber"
                name="accountNumber"
                type="text"
                className="form-control"
                placeholder="Enter account number"
                value={formData.accountNumber}
                onChange={handleChange}
              />
            </div>

            {/* Bank */}

            <div className="col-12 col-md-6">
              <label
                htmlFor="bank"
                className="form-label"
              >
                Bank
              </label>

              <input
                id="bank"
                name="bank"
                type="text"
                className="form-control"
                placeholder="Enter bank name"
                value={formData.bank}
                onChange={handleChange}
              />
            </div>

            {/* Branch */}

            <div className="col-12 col-md-6">
              <label
                htmlFor="branch"
                className="form-label"
              >
                Branch
              </label>

              <input
                id="branch"
                name="branch"
                type="text"
                className="form-control"
                placeholder="Enter branch"
                value={formData.branch}
                onChange={handleChange}
              />
            </div>

            {/* IFSC */}

            <div className="col-12 col-md-6">
              <label
                htmlFor="ifsc"
                className="form-label"
              >
                IFSC
              </label>

              <input
                id="ifsc"
                name="ifsc"
                type="text"
                className="form-control"
                placeholder="Enter IFSC code"
                value={formData.ifsc}
                onChange={handleChange}
              />
            </div>

            {/* Submit */}

            <div className="col-12 mt-4 text-end">
              <button
                type="submit"
                className="btn btn-primary px-4"
              >
                Save Employment Details
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}

export default EmploymentDetailsForm