import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function getSundaysInMonth(month: string) {
  if (!month) return 0

  const [year, monthNumber] = month
    .split('-')
    .map(Number)

  const daysInMonth = new Date(
    year,
    monthNumber,
    0,
  ).getDate()

  let sundays = 0

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(
      year,
      monthNumber - 1,
      day,
    )

    if (date.getDay() === 0) {
      sundays++
    }
  }

  return sundays
}

function AttendanceForm() {
  const navigate = useNavigate()

  const [employeeCode, setEmployeeCode] =
    useState('')

  const [month, setMonth] = useState('')

  const [cl, setCl] = useState('0')
  const [el, setEl] = useState('0')
  const [pl, setPl] = useState('0')
  const [lop, setLop] = useState('0')

  const [otherPaidLeaves, setOtherPaidLeaves] =
    useState('0')

  const [nationalHolidays, setNationalHolidays] =
    useState(0)

  const [saving, setSaving] = useState(false)

  const [attendanceId, setAttendanceId] =
    useState<number | null>(null)

  const daysInMonth = useMemo(() => {
    if (!month) return 0

    const [year, monthNumber] = month
      .split('-')
      .map(Number)

    return new Date(
      year,
      monthNumber,
      0,
    ).getDate()
  }, [month])

  const sundays = useMemo(
    () => getSundaysInMonth(month),
    [month],
  )

  const netPresentDays = useMemo(() => {
    const casualLeave = Number(cl) || 0
    const earnedLeave = Number(el) || 0
    const lossOfPay = Number(lop) || 0

    return Math.max(
      0,
      daysInMonth -
        casualLeave -
        earnedLeave -
        lossOfPay -
        nationalHolidays -
        sundays,
    )
  }, [
    daysInMonth,
    cl,
    el,
    lop,
    nationalHolidays,
    sundays,
  ])

  const netPayableDays = useMemo(() => {
    const paidLeaves =
      Number(otherPaidLeaves) || 0

    return netPresentDays + paidLeaves
  }, [
    netPresentDays,
    otherPaidLeaves,
  ])

  const loadCompanyHolidays = async (
    selectedMonth: string,
  ) => {
    if (!selectedMonth) {
      setNationalHolidays(0)
      return
    }

    try {
      const response = await fetch(
        'http://localhost:8000/company-holidays/',
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result?.detail ||
            'Unable to load company holidays',
        )
      }

      const count = result.filter(
        (holiday: {
          holiday_date: string
        }) =>
          holiday.holiday_date.startsWith(
            selectedMonth,
          ),
      ).length

      setNationalHolidays(count)
    } catch (error) {
      console.error(error)
      setNationalHolidays(0)
    }
  }

  const handleMonthChange = (
    value: string,
  ) => {
    setMonth(value)
    loadCompanyHolidays(value)
  }

  const handleSave = async () => {
    if (!employeeCode.trim()) {
      alert('Please enter Employee Code')
      return
    }

    if (!month) {
      alert('Please select Month')
      return
    }

    try {
      setSaving(true)

      const employmentResponse =
        await fetch(
          `http://localhost:8000/employment/by-code/${encodeURIComponent(
            employeeCode.trim(),
          )}`,
        )

      const employmentResult =
        await employmentResponse.json()

      if (!employmentResponse.ok) {
        throw new Error(
          employmentResult?.detail ||
            'Employee not found',
        )
      }

      const userId =
        employmentResult.user_id

      if (!userId) {
        throw new Error(
          'Employee User ID is missing',
        )
      }

      const attendanceResponse =
        await fetch(
          'http://localhost:8000/attendance/',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              user_id: userId,

              attendance_month:
                `${month}-01`,

              cl: Number(cl) || 0,

              el: Number(el) || 0,

              pl: Number(pl) || 0,

              lop: Number(lop) || 0,

              nh: nationalHolidays,

              sundays,

              other_paid_days:
                Number(
                  otherPaidLeaves,
                ) || 0,

              net_present_days:
                netPresentDays,

              net_payable_days:
                netPayableDays,
            }),
          },
        )

      const attendanceResult =
        await attendanceResponse.json()

      if (!attendanceResponse.ok) {
        throw new Error(
          attendanceResult?.detail ||
            'Failed to save Attendance',
        )
      }

      setAttendanceId(
        attendanceResult.id,
      )

      alert(
        'Attendance saved successfully',
      )
    } catch (error) {
      console.error(error)

      alert(
        error instanceof Error
          ? error.message
          : 'Unable to save Attendance',
      )
    } finally {
      setSaving(false)
    }
  }

  const handleSelectCostElement = () => {
    if (!attendanceId) {
      alert(
        'Please save Attendance first',
      )
      return
    }

    navigate('/admin/cost-of-element', {
      state: {
        employeeCode:
          employeeCode.trim(),

        attendanceId,

        netPresentDays,

        netPayableDays,
      },
    })
  }

  const inputClass =
    'form-control'

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
                  Attendance
                </h1>
              </div>

            </div>

            {/* ATTENDANCE INFORMATION */}

            <div className="border rounded bg-white p-3 p-md-4 mb-3">

              <h2 className="h4 mb-3">
                Attendance Information
              </h2>

              <div className="row g-3">

                {/* EMPLOYEE CODE */}

                <div className="col-md-6">
                  <label className="form-label">
                    Employee Code
                  </label>

                  <input
                    type="text"
                    value={employeeCode}
                    onChange={(event) =>
                      setEmployeeCode(
                        event.target.value,
                      )
                    }
                    className={inputClass}
                    placeholder="Enter employee code"
                  />
                </div>

                {/* MONTH */}

                <div className="col-md-6">
                  <label className="form-label">
                    Attendance Month
                  </label>

                  <input
                    type="month"
                    value={month}
                    onChange={(event) =>
                      handleMonthChange(
                        event.target.value,
                      )
                    }
                    className={inputClass}
                  />
                </div>

              </div>
            </div>

            {/* LEAVE DETAILS */}

            <div className="border rounded bg-white p-3 p-md-4 mb-3">

              <h2 className="h4 mb-3">
                Leave Details
              </h2>

              <div className="row g-3">

                {/* CL */}

                <div className="col-md-3">
                  <label className="form-label">
                    Casual Leave (CL)
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={cl}
                    onChange={(event) =>
                      setCl(
                        event.target.value,
                      )
                    }
                    className={inputClass}
                  />
                </div>

                {/* EL */}

                <div className="col-md-3">
                  <label className="form-label">
                    Earned Leave (EL)
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={el}
                    onChange={(event) =>
                      setEl(
                        event.target.value,
                      )
                    }
                    className={inputClass}
                  />
                </div>

                {/* PL */}

                <div className="col-md-3">
                  <label className="form-label">
                    Paid Leave (PL)
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={pl}
                    onChange={(event) =>
                      setPl(
                        event.target.value,
                      )
                    }
                    className={inputClass}
                  />
                </div>

                {/* LOP */}

                <div className="col-md-3">
                  <label className="form-label">
                    Loss of Pay (LOP)
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={lop}
                    onChange={(event) =>
                      setLop(
                        event.target.value,
                      )
                    }
                    className={inputClass}
                  />
                </div>

                {/* OTHER PAID DAYS */}

                <div className="col-md-6">
                  <label className="form-label">
                    Other Paid Days
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={otherPaidLeaves}
                    onChange={(event) =>
                      setOtherPaidLeaves(
                        event.target.value,
                      )
                    }
                    className={inputClass}
                  />
                </div>

                {/* DAYS IN MONTH */}

                <div className="col-md-6">
                  <label className="form-label">
                    Days in Month
                  </label>

                  <input
                    type="number"
                    value={daysInMonth}
                    disabled
                    className={inputClass}
                  />
                </div>

              </div>
            </div>

            {/* ATTENDANCE CALCULATION */}

            <div className="border rounded bg-white p-3 p-md-4 mb-3">

              <h2 className="h4 mb-3">
                Attendance Calculation
              </h2>

              <div className="row g-3">

                {/* NH */}

                <div className="col-md-4">
                  <label className="form-label">
                    National Holidays (NH)
                  </label>

                  <input
                    type="number"
                    value={nationalHolidays}
                    disabled
                    className={inputClass}
                  />
                </div>

                {/* SUNDAYS */}

                <div className="col-md-4">
                  <label className="form-label">
                    Sundays
                  </label>

                  <input
                    type="number"
                    value={sundays}
                    disabled
                    className={inputClass}
                  />
                </div>

                {/* NET PRESENT */}

                <div className="col-md-4">
                  <label className="form-label">
                    Net Present Days
                  </label>

                  <input
                    type="number"
                    value={netPresentDays}
                    disabled
                    className={inputClass}
                  />
                </div>

                {/* NET PAYABLE */}

                <div className="col-md-6">
                  <label className="form-label">
                    Net Payable Days
                  </label>

                  <input
                    type="number"
                    value={netPayableDays}
                    disabled
                    className={inputClass}
                  />
                </div>

              </div>
            </div>

            {/* BUTTONS */}

            <div className="col-12 d-flex justify-content-end gap-2">

              <button
                type="button"
                className="btn btn-primary btn-lg px-4"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : 'Save'}
              </button>

              {attendanceId && (
                <button
                  type="button"
                  className="btn btn-outline-primary btn-lg px-4"
                  onClick={
                    handleSelectCostElement
                  }
                >
                  Select Cost Element
                </button>
              )}

            </div>

          </div>
        </div>

      </div>
    </div>
  )
}

export default AttendanceForm