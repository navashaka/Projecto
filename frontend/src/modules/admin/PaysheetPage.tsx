import {
	Alert,
	Box,
	Card,
	CardContent,
	CircularProgress,
	Divider,
	Grid,
	Stack,
	Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

type SalaryDetails = {
	id: number
	user_id: number
	basic: number | null
	allowance1: number | null
	allowance2: number | null
	allowance3: number | null
	allowance4: number | null
	allowance5: number | null
	allowance6: number | null
	other_allowance: number | null
	arrears: number | null
	gross: number | null
	epf_deduction: number | null
	esi_insurance_deduction: number | null
	tds: number | null
	canteen_deduction: number | null
	advance_deduction: number | null
	loan_emi: number | null
	other_deduction: number | null
	total_deductions: number | null
	net_salary: number | null
	epf_employer_share: number | null
	esi_employer_share: number | null
	insurance_employer_share: number | null
	transport_allowance: number | null
	canteen_allowance: number | null
	bonus: number | null
	other_employer_contribution: number | null
	total_ctc: number | null
	effective_date: string | null
}

type Attendance = {
	id: number
	user_id: number
	cl: number | null
	el: number | null
	pl: number | null
	lop: number | null
	nh: number | null
	sundays: number | null
	other_paid_days: number | null
	net_present_days: number | null
}

function formatAmount(value: number | null | undefined) {
	return `₹${Number(value ?? 0).toLocaleString('en-IN', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`
}

function PaysheetPage() {
	const location = useLocation()

	const userId = location.state?.userId as number | undefined

	const [salary, setSalary] = useState<SalaryDetails | null>(null)
	const [attendance, setAttendance] = useState<Attendance | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')

	useEffect(() => {
		const loadPaysheet = async () => {
			if (!userId) {
				setError('User ID was not provided from Attendance.')
				setLoading(false)
				return
			}

			try {
				setLoading(true)
				setError('')

				const [salaryResponse, attendanceResponse] = await Promise.all([
					fetch('http://localhost:8000/api/v1/salary-details/'),
					fetch('http://localhost:8000/api/v1/attendance/'),
				])

				if (!salaryResponse.ok) {
					throw new Error('Unable to load salary details')
				}

				if (!attendanceResponse.ok) {
					throw new Error('Unable to load attendance details')
				}

				const salaryData: SalaryDetails[] =
					await salaryResponse.json()

				const attendanceData: Attendance[] =
					await attendanceResponse.json()

				const userSalary = salaryData
					.filter((item) => item.user_id === userId)
					.sort((a, b) => b.id - a.id)[0]

				const userAttendance = attendanceData
					.filter((item) => item.user_id === userId)
					.sort((a, b) => b.id - a.id)[0]

				if (!userSalary) {
					throw new Error(
						`Salary details not found for User ID ${userId}`,
					)
				}

				setSalary(userSalary)
				setAttendance(userAttendance ?? null)
			} catch (err) {
				console.error(err)

				if (err instanceof Error) {
					setError(err.message)
				} else {
					setError('Unable to load paysheet')
				}
			} finally {
				setLoading(false)
			}
		}

		loadPaysheet()
	}, [userId])

	if (loading) {
		return (
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					p: 5,
				}}
			>
				<CircularProgress />
			</Box>
		)
	}

	if (error) {
		return (
			<Stack spacing={2} sx={{ p: { xs: 2, md: 4 } }}>
				<Typography variant="h5">Paysheet</Typography>

				<Alert severity="error">{error}</Alert>
			</Stack>
		)
	}

	if (!salary) {
		return (
			<Alert severity="warning">
				Salary details are not available.
			</Alert>
		)
	}

	return (
		<Stack spacing={3} sx={{ p: { xs: 2, md: 4 } }}>
			<Box>
				<Typography variant="h4">Paysheet</Typography>

				<Typography color="text.secondary">
					Salary and attendance details for User ID {userId}
				</Typography>
			</Box>

			<Card>
				<CardContent>
					<Typography variant="h6" gutterBottom>
						Salary Summary
					</Typography>

					<Divider sx={{ mb: 2 }} />

					<Grid container spacing={2}>
						<Grid size={{ xs: 12, sm: 6, md: 3 }}>
							<Typography color="text.secondary">
								Basic
							</Typography>
							<Typography variant="h6">
								{formatAmount(salary.basic)}
							</Typography>
						</Grid>

						<Grid size={{ xs: 12, sm: 6, md: 3 }}>
							<Typography color="text.secondary">
								Gross Salary
							</Typography>
							<Typography variant="h6">
								{formatAmount(salary.gross)}
							</Typography>
						</Grid>

						<Grid size={{ xs: 12, sm: 6, md: 3 }}>
							<Typography color="text.secondary">
								Total Deductions
							</Typography>
							<Typography variant="h6">
								{formatAmount(salary.total_deductions)}
							</Typography>
						</Grid>

						<Grid size={{ xs: 12, sm: 6, md: 3 }}>
							<Typography color="text.secondary">
								Net Salary
							</Typography>
							<Typography variant="h5">
								{formatAmount(salary.net_salary)}
							</Typography>
						</Grid>
					</Grid>
				</CardContent>
			</Card>

			<Card>
				<CardContent>
					<Typography variant="h6" gutterBottom>
						Allowances
					</Typography>

					<Divider sx={{ mb: 2 }} />

					<Grid container spacing={2}>
						<Grid size={{ xs: 12, sm: 6, md: 3 }}>
							<Typography color="text.secondary">
								Allowance 1
							</Typography>
							<Typography>
								{formatAmount(salary.allowance1)}
							</Typography>
						</Grid>

						<Grid size={{ xs: 12, sm: 6, md: 3 }}>
							<Typography color="text.secondary">
								Allowance 2
							</Typography>
							<Typography>
								{formatAmount(salary.allowance2)}
							</Typography>
						</Grid>

						<Grid size={{ xs: 12, sm: 6, md: 3 }}>
							<Typography color="text.secondary">
								Allowance 3
							</Typography>
							<Typography>
								{formatAmount(salary.allowance3)}
							</Typography>
						</Grid>

						<Grid size={{ xs: 12, sm: 6, md: 3 }}>
							<Typography color="text.secondary">
								Other Allowance
							</Typography>
							<Typography>
								{formatAmount(salary.other_allowance)}
							</Typography>
						</Grid>
					</Grid>
				</CardContent>
			</Card>

			<Card>
				<CardContent>
					<Typography variant="h6" gutterBottom>
						Deductions
					</Typography>

					<Divider sx={{ mb: 2 }} />

					<Grid container spacing={2}>
						<Grid size={{ xs: 12, sm: 6, md: 3 }}>
							<Typography color="text.secondary">
								EPF
							</Typography>
							<Typography>
								{formatAmount(salary.epf_deduction)}
							</Typography>
						</Grid>

						<Grid size={{ xs: 12, sm: 6, md: 3 }}>
							<Typography color="text.secondary">
								ESI
							</Typography>
							<Typography>
								{formatAmount(salary.esi_insurance_deduction)}
							</Typography>
						</Grid>

						<Grid size={{ xs: 12, sm: 6, md: 3 }}>
							<Typography color="text.secondary">
								TDS
							</Typography>
							<Typography>
								{formatAmount(salary.tds)}
							</Typography>
						</Grid>

						<Grid size={{ xs: 12, sm: 6, md: 3 }}>
							<Typography color="text.secondary">
								Other Deduction
							</Typography>
							<Typography>
								{formatAmount(salary.other_deduction)}
							</Typography>
						</Grid>
					</Grid>
				</CardContent>
			</Card>

			<Card>
				<CardContent>
					<Typography variant="h6" gutterBottom>
						Attendance
					</Typography>

					<Divider sx={{ mb: 2 }} />

					{attendance ? (
						<Grid container spacing={2}>
							<Grid size={{ xs: 12, sm: 6, md: 3 }}>
								<Typography color="text.secondary">
									CL
								</Typography>
								<Typography>
									{attendance.cl ?? 0}
								</Typography>
							</Grid>

							<Grid size={{ xs: 12, sm: 6, md: 3 }}>
								<Typography color="text.secondary">
									EL
								</Typography>
								<Typography>
									{attendance.el ?? 0}
								</Typography>
							</Grid>

							<Grid size={{ xs: 12, sm: 6, md: 3 }}>
								<Typography color="text.secondary">
									LOP
								</Typography>
								<Typography>
									{attendance.lop ?? 0}
								</Typography>
							</Grid>

							<Grid size={{ xs: 12, sm: 6, md: 3 }}>
								<Typography color="text.secondary">
									Net Present Days
								</Typography>
								<Typography>
									{attendance.net_present_days ?? 0}
								</Typography>
							</Grid>
						</Grid>
					) : (
						<Typography color="text.secondary">
							Attendance record not found.
						</Typography>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardContent>
					<Typography variant="h6" gutterBottom>
						Final Salary
					</Typography>

					<Divider sx={{ mb: 2 }} />

					<Typography color="text.secondary">
						Current Net Payable Salary
					</Typography>

					<Typography variant="h3">
						{formatAmount(salary.net_salary)}
					</Typography>

					{salary.effective_date && (
						<Typography color="text.secondary" sx={{ mt: 1 }}>
							Effective from: {salary.effective_date}
						</Typography>
					)}
				</CardContent>
			</Card>
		</Stack>
	)
}

export default PaysheetPage