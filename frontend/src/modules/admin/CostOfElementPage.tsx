import {
	Button,
	Grid,
	Paper,
	Stack,
	TextField,
	Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

type CostOfElementRow = {
	id: number
	item: string
	workedDays: number
}

function CostOfElementPage() {
	const location = useLocation()
	const navigate = useNavigate()

	const employeeCode =
		location.state?.employeeCode ?? ''

	const attendanceId =
		location.state?.attendanceId ?? null

	const netPayableDays =
		Number(location.state?.netPayableDays) || 0

	const [item, setItem] = useState('')
	const [workedDays, setWorkedDays] = useState('')

	const [rows, setRows] = useState<
		CostOfElementRow[]
	>([])

	const [saving, setSaving] = useState(false)

	const totalWorkedDays = useMemo(() => {
		return rows.reduce(
			(total, row) =>
				total + row.workedDays,
			0,
		)
	}, [rows])

	const handleAdd = () => {
		if (!item.trim()) {
			alert('Please enter Item')
			return
		}

		const days = Number(workedDays)

		if (!days || days <= 0) {
			alert('Please enter valid Worked Days')
			return
		}

		const newTotal =
			totalWorkedDays + days

		if (newTotal > netPayableDays) {
			alert(
				`Total Worked Days cannot exceed Net Payable Days (${netPayableDays}).`,
			)
			return
		}

		const newRow: CostOfElementRow = {
			id: Date.now(),
			item: item.trim(),
			workedDays: days,
		}

		setRows((previous) => [
			...previous,
			newRow,
		])

		setItem('')
		setWorkedDays('')
	}

	const handleDelete = (id: number) => {
		setRows((previous) =>
			previous.filter(
				(row) => row.id !== id,
			),
		)
	}

	const handleSave = async () => {
		if (!employeeCode) {
			alert('Employee Code is missing')
			return
		}

		if (!attendanceId) {
			alert('Attendance ID is missing')
			return
		}

		if (rows.length === 0) {
			alert(
				'Please add at least one Cost Element',
			)
			return
		}

		if (
			totalWorkedDays !==
			netPayableDays
		) {
			alert(
				'Total Worked Days must equal Net Payable Days.',
			)
			return
		}

		try {
			setSaving(true)

			const employmentResponse =
				await fetch(
					`http://localhost:8000/api/v1/employment/by-code/${encodeURIComponent(
						employeeCode,
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

			for (const row of rows) {
				const coeResponse =
					await fetch(
						'http://localhost:8000/api/v1/attendance-coe/',
						{
							method: 'POST',
							headers: {
								'Content-Type':
									'application/json',
							},
							body: JSON.stringify({
								attendance_id:
									attendanceId,
								item: row.item,
								worked_days:
									row.workedDays,
								salary_per_day: 0,
								amount: 0,
							}),
						},
					)

				const coeResult =
					await coeResponse.json()

				if (!coeResponse.ok) {
					throw new Error(
						coeResult?.detail ||
							'Failed to save Cost Element',
					)
				}
			}

			alert(
				'Cost Element saved successfully',
			)

			navigate('/admin/paysheet', {
				state: {
					userId,
					employeeCode,
					attendanceId,
					netPayableDays,
				},
			})
		} catch (error) {
			console.error(error)

			alert(
				error instanceof Error
					? error.message
					: 'Unable to save Cost Element',
			)
		} finally {
			setSaving(false)
		}
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
					Cost Element
				</Typography>

				<TextField
					label="Employee Code"
					value={employeeCode}
					disabled
					fullWidth
				/>

				<TextField
					label="Net Payable Days"
					value={netPayableDays}
					disabled
					fullWidth
				/>

				<Grid container spacing={2}>
					<Grid
						size={{
							xs: 12,
							md: 6,
						}}
					>
						<TextField
							label="Item"
							placeholder="Example: Software Development"
							value={item}
							onChange={(event) =>
								setItem(
									event.target.value,
								)
							}
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
							label="Worked Days"
							type="number"
							value={workedDays}
							onChange={(event) =>
								setWorkedDays(
									event.target.value,
								)
							}
							slotProps={{
								htmlInput: {
									min: 1,
								},
							}}
							fullWidth
						/>
					</Grid>

					<Grid
						size={{
							xs: 12,
							md: 2,
						}}
					>
						<Button
							type="button"
							variant="outlined"
							onClick={handleAdd}
							fullWidth
							sx={{
								height: '100%',
							}}
						>
							+ Add Item
						</Button>
					</Grid>
				</Grid>

				{rows.length > 0 && (
					<Stack spacing={1}>
						{rows.map((row) => (
							<Paper
								key={row.id}
								variant="outlined"
								sx={{ p: 2 }}
							>
								<Grid
									container
									spacing={2}
									sx={{
										alignItems:
											'center',
									}}
								>
									<Grid
										size={{
											xs: 12,
											md: 5,
										}}
									>
										<Typography>
											<strong>
												Item:
											</strong>{' '}
											{row.item}
										</Typography>
									</Grid>

									<Grid
										size={{
											xs: 12,
											md: 4,
										}}
									>
										<Typography>
											<strong>
												Worked Days:
											</strong>{' '}
											{
												row.workedDays
											}
										</Typography>
									</Grid>

									<Grid
										size={{
											xs: 12,
											md: 3,
										}}
									>
										<Button
											type="button"
											color="error"
											size="small"
											onClick={() =>
												handleDelete(
													row.id,
												)
											}
										>
											Delete
										</Button>
									</Grid>
								</Grid>
							</Paper>
						))}

						<Typography variant="h6">
							Total Worked Days:{' '}
							{totalWorkedDays} /{' '}
							{netPayableDays}
						</Typography>
					</Stack>
				)}

				<Button
					type="button"
					variant="contained"
					onClick={handleSave}
					disabled={
						saving ||
						rows.length === 0 ||
						totalWorkedDays !==
							netPayableDays
					}
					sx={{
						alignSelf: 'flex-start',
					}}
				>
					{saving
						? 'Saving...'
						: 'Save Cost Element'}
				</Button>
			</Stack>
		</Paper>
	)
}

export default CostOfElementPage