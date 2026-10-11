import { useEffect, useState } from 'react'
import {
	Button,
	Grid,
	Paper,
	Stack,
	TextField,
	Typography,
} from '@mui/material'
import { useForm, useWatch } from 'react-hook-form'
import HRBackButton from '../HRBackButton'

type ReimbursementFormData = {
	user_id: number
	name: string
	employee_code: string
	designation: string
	department: string
	from_date: string
	to_date: string
	place_visited: string
	purpose_of_visit: string
	expense_type1: string
	expense_amount1?: number
	attachment1: string
	expense_type2: string
	expense_amount2?: number
	attachment2: string
	other_expense_type: string
	other_expense_amount?: number
	attachment3: string
	total_amount: number
}

const getNumber = (value: unknown) => {
	const number = Number(value)
	return Number.isFinite(number) ? number : 0
}

const roundValue = (value: number) =>
	Math.round((value + Number.EPSILON) * 100) / 100

function TravellingExpensesReimbursementForm() {
	const [submitting, setSubmitting] = useState(false)
	const [successMessage, setSuccessMessage] = useState('')
	const [errorMessage, setErrorMessage] = useState('')

	const {
		register,
		control,
		handleSubmit,
		setValue,
	} = useForm<ReimbursementFormData>({
		defaultValues: {
			user_id: 1,
			name: '',
			employee_code: '',
			designation: '',
			department: '',
			from_date: '',
			to_date: '',
			place_visited: '',
			purpose_of_visit: '',
			expense_type1: '',
			expense_amount1: undefined,
			attachment1: '',
			expense_type2: '',
			expense_amount2: undefined,
			attachment2: '',
			other_expense_type: '',
			other_expense_amount: undefined,
			attachment3: '',
			total_amount: 0,
		},
	})

	const expenseAmount1 = useWatch({
		control,
		name: 'expense_amount1',
	})

	const expenseAmount2 = useWatch({
		control,
		name: 'expense_amount2',
	})

	const otherExpenseAmount = useWatch({
		control,
		name: 'other_expense_amount',
	})

	const totalAmount = roundValue(
		getNumber(expenseAmount1) +
			getNumber(expenseAmount2) +
			getNumber(otherExpenseAmount),
	)

	useEffect(() => {
		setValue('total_amount', totalAmount)
	}, [totalAmount, setValue])

	const onSubmit = async (data: ReimbursementFormData) => {
		setSubmitting(true)
		setSuccessMessage('')
		setErrorMessage('')

		try {
			const response = await fetch(
				'http://127.0.0.1:8000/travelling-expenses-reimbursement/',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						...data,
						total_amount: totalAmount,
					}),
				},
			)

			const result = await response.json()

			if (!response.ok) {
				throw new Error(
					result?.detail
						? JSON.stringify(result.detail)
						: 'Failed to submit reimbursement',
				)
			}

			setSuccessMessage('Submitted successfully!')
		} catch (error) {
			setErrorMessage(
				error instanceof Error
					? error.message
					: 'Something went wrong',
			)
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<Paper
			component="form"
			onSubmit={handleSubmit(onSubmit)}
			sx={{ p: { xs: 2, md: 4 } }}
		>
			<Stack spacing={3}>
				<div>
					<Typography variant="h5">
						Travelling expenses reimbursement
					</Typography>

					<Typography color="text.secondary" variant="body2">
						Capture travel details and reimbursable expenses.
					</Typography>
				</div>

				{successMessage && (
					<div
						style={{
							padding: '12px',
							backgroundColor: '#d1e7dd',
							color: '#0f5132',
							borderRadius: '6px',
						}}
					>
						{successMessage}
					</div>
				)}

				{errorMessage && (
					<div
						style={{
							padding: '12px',
							backgroundColor: '#f8d7da',
							color: '#842029',
							borderRadius: '6px',
						}}
					>
						{errorMessage}
					</div>
				)}

				<Grid container spacing={2}>
					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('user_id', {
								valueAsNumber: true,
							})}
							label="User ID"
							type="number"
							required
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('name')}
							label="Name"
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('employee_code')}
							label="Employee code"
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('designation')}
							label="Designation"
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('department')}
							label="Department"
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('from_date')}
							label="From date"
							type="date"
							slotProps={{
								inputLabel: { shrink: true },
							}}
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('to_date')}
							label="To date"
							type="date"
							slotProps={{
								inputLabel: { shrink: true },
							}}
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('place_visited')}
							label="Place visited"
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12 }}>
						<TextField
							{...register('purpose_of_visit')}
							label="Purpose of visit"
							multiline
							minRows={3}
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('expense_type1')}
							label="Expense type 1"
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('expense_amount1', {
								setValueAs: (value) =>
									value === ''
										? undefined
										: Number(value),
							})}
							label="Expense amount 1"
							type="number"
							slotProps={{
								htmlInput: { step: '0.01' },
							}}
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('attachment1')}
							label="Attachment 1"
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('expense_type2')}
							label="Expense type 2"
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('expense_amount2', {
								setValueAs: (value) =>
									value === ''
										? undefined
										: Number(value),
							})}
							label="Expense amount 2"
							type="number"
							slotProps={{
								htmlInput: { step: '0.01' },
							}}
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('attachment2')}
							label="Attachment 2"
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('other_expense_type')}
							label="Other expense type"
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('other_expense_amount', {
								setValueAs: (value) =>
									value === ''
										? undefined
										: Number(value),
							})}
							label="Other expense amount"
							type="number"
							slotProps={{
								htmlInput: { step: '0.01' },
							}}
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('attachment3')}
							label="Attachment 3"
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							label="Total amount"
							type="number"
							value={totalAmount}
							slotProps={{
								htmlInput: {
									step: '0.01',
									readOnly: true,
								},
							}}
							fullWidth
						/>
					</Grid>
				</Grid>

				<div className="d-flex justify-content-end gap-2">
					<Button
						type="submit"
						variant="contained"
						disabled={submitting}
					>
						{submitting ? 'Submitting...' : 'Submit'}
					</Button>
					<HRBackButton />
				</div>
			</Stack>
		</Paper>
	)
}

export default TravellingExpensesReimbursementForm