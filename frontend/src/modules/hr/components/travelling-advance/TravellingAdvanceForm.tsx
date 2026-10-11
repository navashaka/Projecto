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

type TravellingAdvanceFormData = {
	user_id: number
	employee_code: string
	designation: string
	department: string
	from_date: string
	to_date: string
	place_visited: string
	purpose_of_visit: string
	type_of_expense: string
	expense_amount?: number
	additional_expense_type: string
	additional_expense_amount?: number
	other_expense_type: string
	other_expense_amount?: number
	total_advance: number
}

const getNumber = (value: unknown) => {
	const number = Number(value)
	return Number.isFinite(number) ? number : 0
}

const roundValue = (value: number) =>
	Math.round((value + Number.EPSILON) * 100) / 100

function TravellingAdvanceForm() {
	const [submitting, setSubmitting] = useState(false)
	const [successMessage, setSuccessMessage] = useState('')
	const [errorMessage, setErrorMessage] = useState('')

	const {
		register,
		control,
		handleSubmit,
		setValue,
	} = useForm<TravellingAdvanceFormData>({
		defaultValues: {
			user_id: 1,
			employee_code: '',
			designation: '',
			department: '',
			from_date: '',
			to_date: '',
			place_visited: '',
			purpose_of_visit: '',
			type_of_expense: '',
			expense_amount: undefined,
			additional_expense_type: '',
			additional_expense_amount: undefined,
			other_expense_type: '',
			other_expense_amount: undefined,
			total_advance: 0,
		},
	})

	const expenseAmount = useWatch({
		control,
		name: 'expense_amount',
	})

	const additionalExpenseAmount = useWatch({
		control,
		name: 'additional_expense_amount',
	})

	const otherExpenseAmount = useWatch({
		control,
		name: 'other_expense_amount',
	})

	const totalAdvance = roundValue(
		getNumber(expenseAmount) +
			getNumber(additionalExpenseAmount) +
			getNumber(otherExpenseAmount),
	)

	useEffect(() => {
		setValue('total_advance', totalAdvance)
	}, [totalAdvance, setValue])

	const onSubmit = async (data: TravellingAdvanceFormData) => {
		setSubmitting(true)
		setSuccessMessage('')
		setErrorMessage('')

		try {
			const response = await fetch(
				'http://127.0.0.1:8000/travelling-advance/',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						...data,
						total_advance: totalAdvance,
					}),
				},
			)

			const result = await response.json()

			if (!response.ok) {
				throw new Error(
					result?.detail
						? JSON.stringify(result.detail)
						: 'Failed to submit travelling advance',
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
						Travelling advance
					</Typography>

					<Typography color="text.secondary" variant="body2">
						Capture travel dates, purpose, and advance expenses.
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

					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('type_of_expense')}
							label="Type of expense"
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
							{...register('expense_amount', {
								setValueAs: (value) =>
									value === ''
										? undefined
										: Number(value),
							})}
							label="Expense amount"
							type="number"
							slotProps={{
								htmlInput: { step: '0.01' },
							}}
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('additional_expense_type')}
							label="Additional expense type"
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('additional_expense_amount', {
								setValueAs: (value) =>
									value === ''
										? undefined
										: Number(value),
							})}
							label="Additional expense amount"
							type="number"
							slotProps={{
								htmlInput: { step: '0.01' },
							}}
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
							label="Total advance"
							type="number"
							value={totalAdvance}
							slotProps={{
								htmlInput: { step: '0.01' },
								input:{ readOnly:true}
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

export default TravellingAdvanceForm