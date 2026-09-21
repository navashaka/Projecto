import {
	Button,
	Grid,
	Paper,
	Stack,
	TextField,
	Typography,
} from '@mui/material'
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
				'http://localhost:8000/api/v1/company-holidays/',
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
					`http://localhost:8000/api/v1/employment/by-code/${encodeURIComponent(
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
					'http://localhost:8000/api/v1/attendance/',
					{
						method: 'POST',
						headers: {
							'Content-Type':
								'application/json',
						},
						body: JSON.stringify({
							user_id: userId,
							attendance_month: `${month}-01`,
							cl: Number(cl) || 0,
							el: Number(el) || 0,
							pl: 0,
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

	return (
		<Paper
			sx={{
				p: {
					xs: 2,
					md: 4,
				},
			}}
		>
			<Stack spacing={3}>
				<Typography variant="h5">
					Attendance
				</Typography>

				<Grid container spacing={2}>
					<Grid
						size={{
							xs: 12,
							md: 6,
						}}
					>
						<TextField
							label="Employee Code"
							value={employeeCode}
							onChange={(event) =>
								setEmployeeCode(
									event.target.value,
								)
							}
							fullWidth
						/>
					</Grid>

					<Grid
						size={{
							xs: 12,
							md: 6,
						}}
					>
						<TextField
							label="Month"
							type="month"
							value={month}
							onChange={(event) =>
								handleMonthChange(
									event.target.value,
								)
							}
							fullWidth
							slotProps={{
								inputLabel: {
									shrink: true,
								},
							}}
						/>
					</Grid>

					<Grid
						size={{
							xs: 12,
							md: 3,
						}}
					>
						<TextField
							label="Casual Leave (CL)"
							type="number"
							value={cl}
							onChange={(event) =>
								setCl(
									event.target.value,
								)
							}
							slotProps={{
								htmlInput: {
									min: 0,
								},
							}}
							fullWidth
						/>
					</Grid>

					<Grid
						size={{
							xs: 12,
							md: 3,
						}}
					>
						<TextField
							label="Earned Leave (EL)"
							type="number"
							value={el}
							onChange={(event) =>
								setEl(
									event.target.value,
								)
							}
							slotProps={{
								htmlInput: {
									min: 0,
								},
							}}
							fullWidth
						/>
					</Grid>

					<Grid
						size={{
							xs: 12,
							md: 3,
						}}
					>
						<TextField
							label="Loss of Pay (LOP)"
							type="number"
							value={lop}
							onChange={(event) =>
								setLop(
									event.target.value,
								)
							}
							slotProps={{
								htmlInput: {
									min: 0,
								},
							}}
							fullWidth
						/>
					</Grid>

					<Grid
						size={{
							xs: 12,
							md: 3,
						}}
					>
						<TextField
							label="Other Paid Leaves"
							type="number"
							value={otherPaidLeaves}
							onChange={(event) =>
								setOtherPaidLeaves(
									event.target.value,
								)
							}
							slotProps={{
								htmlInput: {
									min: 0,
								},
							}}
							fullWidth
						/>
					</Grid>

					<Grid
						size={{
							xs: 12,
							md: 4,
						}}
					>
						<TextField
							label="National Holiday (NH)"
							value={nationalHolidays}
							disabled
							fullWidth
						/>
					</Grid>

					<Grid
						size={{
							xs: 12,
							md: 4,
						}}
					>
						<TextField
							label="Sundays"
							value={sundays}
							disabled
							fullWidth
						/>
					</Grid>

					<Grid
						size={{
							xs: 12,
							md: 4,
						}}
					>
						<TextField
							label="Net Present Days"
							value={netPresentDays}
							disabled
							fullWidth
						/>
					</Grid>

					<Grid
						size={{
							xs: 12,
						}}
					>
						<TextField
							label="Net Payable Days"
							value={netPayableDays}
							disabled
							fullWidth
						/>
					</Grid>
				</Grid>

				<Stack
					direction={{
						xs: 'column',
						sm: 'row',
					}}
					spacing={2}
				>
					<Button
						variant="contained"
						onClick={handleSave}
						disabled={saving}
					>
						{saving
							? 'Saving...'
							: 'Save'}
					</Button>

					{attendanceId && (
						<Button
							variant="outlined"
							onClick={
								handleSelectCostElement
							}
						>
							Select Cost Element
						</Button>
					)}
				</Stack>
			</Stack>
		</Paper>
	)
}

export default AttendanceForm