import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	CircularProgress,
	Divider,
	Grid,
	MenuItem,
	Stack,
	TextField,
	Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

type PaysheetData = {
	user_id: number
	salary_month: string
	employee_code: string | null
	employee_name: string | null
	designation: string | null
	department: string | null
	date_of_joining: string | null
	total_days: number | null
	present_days: number | null
	paid_days: number | null
	lop_days: number | null
	basic: number | null
	hra: number | null
	allowances: number | null
	other_earnings: number | null
	gross_earnings: number | null
	epf: number | null
	esi: number | null
	professional_tax: number | null
	tds: number | null
	advance_deduction: number | null
	other_deductions: number | null
	total_deductions: number | null
	net_salary: number | null
}

function formatAmount(
	value: number | null | undefined,
) {
	return `₹${Number(value ?? 0).toLocaleString(
		'en-IN',
		{
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		},
	)}`
}

function getCurrentMonth() {
	const today = new Date()

	return `${today.getFullYear()}-${String(
		today.getMonth() + 1,
	).padStart(2, '0')}`
}

function PaysheetPage() {
	const location = useLocation()

	const stateUserId =
		location.state?.userId as
			| number
			| undefined

	const attendanceUserId =
		location.state?.userId as
			| number
			| undefined

	const userId =
		stateUserId ?? attendanceUserId

	const [month, setMonth] = useState(
		getCurrentMonth(),
	)

	const [paysheet, setPaysheet] =
		useState<PaysheetData | null>(null)

	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	const loadPaysheet = async () => {
		if (!userId) {
			setError(
				'User ID was not provided.',
			)
			return
		}

		if (!month) {
			setError('Please select month.')
			return
		}

		try {
			setLoading(true)
			setError('')
			setPaysheet(null)

			const response = await fetch(
				`http://localhost:8000/api/v1/paysheets/calculate/${userId}?salary_month=${month}-01`,
			)

			const result =
				await response.json()

			if (!response.ok) {
				throw new Error(
					result?.detail ||
						'Unable to generate Paysheet',
				)
			}

			setPaysheet(result)
		} catch (err) {
			console.error(err)

			setError(
				err instanceof Error
					? err.message
					: 'Unable to generate Paysheet',
			)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (userId) {
			loadPaysheet()
		}
	}, [userId])

	if (!userId) {
		return (
			<Stack
				spacing={2}
				sx={{
					p: {
						xs: 2,
						md: 4,
					},
				}}
			>
				<Typography variant="h5">
					Paysheet
				</Typography>

				<Alert severity="warning">
					Open Paysheet from Attendance
					after saving employee
					attendance.
				</Alert>
			</Stack>
		)
	}

	return (
		<Stack
			spacing={3}
			sx={{
				p: {
					xs: 2,
					md: 4,
				},
			}}
		>
			<Box>
				<Typography variant="h4">
					Paysheet
				</Typography>

				<Typography color="text.secondary">
					Monthly employee paysheet
				</Typography>
			</Box>

			<Card>
				<CardContent>
					<Grid
						container
						spacing={2}
						sx={{ alignItems: 'center' }}
					>
						<Grid
							size={{
								xs: 12,
								md: 6,
							}}
						>
							<TextField
								select
								label="Salary Month"
								value={month}
								onChange={(event) =>
									setMonth(
										event.target.value,
									)
								}
								fullWidth
							>
								<MenuItem value="2026-01">
									January 2026
								</MenuItem>

								<MenuItem value="2026-02">
									February 2026
								</MenuItem>

								<MenuItem value="2026-03">
									March 2026
								</MenuItem>

								<MenuItem value="2026-04">
									April 2026
								</MenuItem>

								<MenuItem value="2026-05">
									May 2026
								</MenuItem>

								<MenuItem value="2026-06">
									June 2026
								</MenuItem>

								<MenuItem value="2026-07">
									July 2026
								</MenuItem>

								<MenuItem value="2026-08">
									August 2026
								</MenuItem>

								<MenuItem value="2026-09">
									September 2026
								</MenuItem>

								<MenuItem value="2026-10">
									October 2026
								</MenuItem>

								<MenuItem value="2026-11">
									November 2026
								</MenuItem>

								<MenuItem value="2026-12">
									December 2026
								</MenuItem>
							</TextField>
						</Grid>

						<Grid
							size={{
								xs: 12,
								md: 3,
							}}
						>
							<Button
								variant="contained"
								onClick={loadPaysheet}
								disabled={loading}
								fullWidth
							>
								{loading
									? 'Generating...'
									: 'Generate Paysheet'}
							</Button>
						</Grid>
					</Grid>
				</CardContent>
			</Card>

			{loading && (
				<Box
					sx={{
						display: 'flex',
						justifyContent:
							'center',
						p: 4,
					}}
				>
					<CircularProgress />
				</Box>
			)}

			{error && (
				<Alert severity="error">
					{error}
				</Alert>
			)}

			{paysheet && !loading && (
				<>
					<Card>
						<CardContent>
							<Typography
								variant="h5"
								gutterBottom
							>
								Employee Details
							</Typography>

							<Divider
								sx={{ mb: 2 }}
							/>

							<Grid
								container
								spacing={2}
							>
								<Grid
									size={{
										xs: 12,
										sm: 6,
										md: 3,
									}}
								>
									<Typography color="text.secondary">
										Employee Code
									</Typography>

									<Typography>
										{paysheet.employee_code ||
											'-'}
									</Typography>
								</Grid>

								<Grid
									size={{
										xs: 12,
										sm: 6,
										md: 3,
									}}
								>
									<Typography color="text.secondary">
										Employee Name
									</Typography>

									<Typography>
										{paysheet.employee_name ||
											'-'}
									</Typography>
								</Grid>

								<Grid
									size={{
										xs: 12,
										sm: 6,
										md: 3,
									}}
								>
									<Typography color="text.secondary">
										Designation
									</Typography>

									<Typography>
										{paysheet.designation ||
											'-'}
									</Typography>
								</Grid>

								<Grid
									size={{
										xs: 12,
										sm: 6,
										md: 3,
									}}
								>
									<Typography color="text.secondary">
										Department
									</Typography>

									<Typography>
										{paysheet.department ||
											'-'}
									</Typography>
								</Grid>
							</Grid>
						</CardContent>
					</Card>

					<Card>
						<CardContent>
							<Typography
								variant="h5"
								gutterBottom
							>
								Attendance
							</Typography>

							<Divider
								sx={{ mb: 2 }}
							/>

							<Grid
								container
								spacing={2}
							>
								<Grid
									size={{
										xs: 12,
										sm: 6,
										md: 3,
									}}
								>
									<Typography color="text.secondary">
										Total Days
									</Typography>

									<Typography variant="h6">
										{paysheet.total_days ??
											0}
									</Typography>
								</Grid>

								<Grid
									size={{
										xs: 12,
										sm: 6,
										md: 3,
									}}
								>
									<Typography color="text.secondary">
										Present Days
									</Typography>

									<Typography variant="h6">
										{paysheet.present_days ??
											0}
									</Typography>
								</Grid>

								<Grid
									size={{
										xs: 12,
										sm: 6,
										md: 3,
									}}
								>
									<Typography color="text.secondary">
										Paid Days
									</Typography>

									<Typography variant="h6">
										{paysheet.paid_days ??
											0}
									</Typography>
								</Grid>

								<Grid
									size={{
										xs: 12,
										sm: 6,
										md: 3,
									}}
								>
									<Typography color="text.secondary">
										LOP Days
									</Typography>

									<Typography variant="h6">
										{paysheet.lop_days ??
											0}
									</Typography>
								</Grid>
							</Grid>
						</CardContent>
					</Card>

					<Card>
						<CardContent>
							<Typography
								variant="h5"
								gutterBottom
							>
								Earnings
							</Typography>

							<Divider
								sx={{ mb: 2 }}
							/>

							<Grid
								container
								spacing={2}
							>
								<Grid
									size={{
										xs: 12,
										sm: 6,
										md: 3,
									}}
								>
									<Typography color="text.secondary">
										Basic
									</Typography>

									<Typography>
										{formatAmount(
											paysheet.basic,
										)}
									</Typography>
								</Grid>

								<Grid
									size={{
										xs: 12,
										sm: 6,
										md: 3,
									}}
								>
									<Typography color="text.secondary">
										HRA
									</Typography>

									<Typography>
										{formatAmount(
											paysheet.hra,
										)}
									</Typography>
								</Grid>

								<Grid
									size={{
										xs: 12,
										sm: 6,
										md: 3,
									}}
								>
									<Typography color="text.secondary">
										Allowances
									</Typography>

									<Typography>
										{formatAmount(
											paysheet.allowances,
										)}
									</Typography>
								</Grid>

								<Grid
									size={{
										xs: 12,
										sm: 6,
										md: 3,
									}}
								>
									<Typography color="text.secondary">
										Other Earnings
									</Typography>

									<Typography>
										{formatAmount(
											paysheet.other_earnings,
										)}
									</Typography>
								</Grid>

								<Grid
									size={{
										xs: 12,
									}}
								>
									<Typography color="text.secondary">
										Gross Earnings
									</Typography>

									<Typography variant="h5">
										{formatAmount(
											paysheet.gross_earnings,
										)}
									</Typography>
								</Grid>
							</Grid>
						</CardContent>
					</Card>

					<Card>
						<CardContent>
							<Typography
								variant="h5"
								gutterBottom
							>
								Deductions
							</Typography>

							<Divider
								sx={{ mb: 2 }}
							/>

							<Grid
								container
								spacing={2}
							>
								<Grid
									size={{
										xs: 12,
										sm: 6,
										md: 3,
									}}
								>
									<Typography color="text.secondary">
										EPF
									</Typography>

									<Typography>
										{formatAmount(
											paysheet.epf,
										)}
									</Typography>
								</Grid>

								<Grid
									size={{
										xs: 12,
										sm: 6,
										md: 3,
									}}
								>
									<Typography color="text.secondary">
										ESI
									</Typography>

									<Typography>
										{formatAmount(
											paysheet.esi,
										)}
									</Typography>
								</Grid>

								<Grid
									size={{
										xs: 12,
										sm: 6,
										md: 3,
									}}
								>
									<Typography color="text.secondary">
										TDS
									</Typography>

									<Typography>
										{formatAmount(
											paysheet.tds,
										)}
									</Typography>
								</Grid>

								<Grid
									size={{
										xs: 12,
										sm: 6,
										md: 3,
									}}
								>
									<Typography color="text.secondary">
										Other Deductions
									</Typography>

									<Typography>
										{formatAmount(
											paysheet.other_deductions,
										)}
									</Typography>
								</Grid>

								<Grid
									size={{
										xs: 12,
									}}
								>
									<Typography color="text.secondary">
										Total Deductions
									</Typography>

									<Typography variant="h6">
										{formatAmount(
											paysheet.total_deductions,
										)}
									</Typography>
								</Grid>
							</Grid>
						</CardContent>
					</Card>

					<Card>
						<CardContent>
							<Typography
								variant="h5"
								gutterBottom
							>
								Net Salary
							</Typography>

							<Divider
								sx={{ mb: 2 }}
							/>

							<Typography
								variant="h3"
								sx={{ fontWeight: "bold" }}
							>
								{formatAmount(
									paysheet.net_salary,
								)}
							</Typography>

							<Typography
								color="text.secondary"
								sx={{ mt: 1 }}
							>
								Salary Month:{' '}
								{paysheet.salary_month}
							</Typography>
						</CardContent>
					</Card>
				</>
			)}
		</Stack>
	)
}

export default PaysheetPage