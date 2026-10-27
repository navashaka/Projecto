import { useEffect, useState } from 'react'
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Grid,
	IconButton,
	Paper,
	Stack,
	TextField,
	Typography,
} from '@mui/material'
import { Add, Delete } from '@mui/icons-material'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import HRBackButton from '../HRBackButton'

const schema = z.object({
	employee_code: z.string().trim().min(1, 'Employee code is required'),
	designation: z.string(),
	department: z.string(),
	from_date: z.string(),
	to_date: z.string(),
	place_to_be_visited: z.string(),
	purpose_of_visit: z.string(),
})

type FormData = z.infer<typeof schema>

type BudgetItem = {
	type: string
	amount: string
}

const API = 'http://127.0.0.1:8000'

function numberToWords(amount: number): string {
	const ones = [
		'', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
		'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen',
		'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
	]
	const tens = [
		'', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
		'Sixty', 'Seventy', 'Eighty', 'Ninety',
	]

	const convert = (n: number): string => {
		if (n === 0) return ''
		if (n < 20) return ones[n]
		if (n < 100) return `${tens[Math.floor(n / 10)]} ${ones[n % 10]}`.trim()
		if (n < 1000) return `${ones[Math.floor(n / 100)]} Hundred ${convert(n % 100)}`.trim()
		if (n < 100000) return `${convert(Math.floor(n / 1000))} Thousand ${convert(n % 1000)}`.trim()
		if (n < 10000000) return `${convert(Math.floor(n / 100000))} Lakh ${convert(n % 100000)}`.trim()
		return `${convert(Math.floor(n / 10000000))} Crore ${convert(n % 10000000)}`.trim()
	}

	const [rupees, paise] = amount.toFixed(2).split('.')
	return `${convert(Number(rupees)) || 'Zero'} Rupees${
		Number(paise) ? ` and ${convert(Number(paise))} Paise` : ''
	} Only`
}

export default function TravellingAdvanceForm() {
	const [employeeError, setEmployeeError] = useState('')
	const [employeeLoading, setEmployeeLoading] = useState(false)
	const [message, setMessage] = useState('')
	const [errorMessage, setErrorMessage] = useState('')
	const [reviewOpen, setReviewOpen] = useState(false)
	const [submitting, setSubmitting] = useState(false)
	const [budgets, setBudgets] = useState<BudgetItem[]>([
		{ type: '', amount: '' },
	])
	const [otherExpense, setOtherExpense] = useState('')
	const [otherExpenseType, setOtherExpenseType] = useState('')

	const {
		register,
		control,
		setValue,
		getValues,
		handleSubmit,
		formState: { errors },
	} = useForm<FormData>({
		resolver: zodResolver(schema),
		defaultValues: {
			employee_code: '',
			designation: '',
			department: '',
			from_date: '',
			to_date: '',
			place_to_be_visited: '',
			purpose_of_visit: '',
		},
	})

	const employeeCode = useWatch({ control, name: 'employee_code' })

	useEffect(() => {
		const code = employeeCode?.trim().toUpperCase()

		if (!code) {
			setValue('designation', '')
			setValue('department', '')
			setEmployeeError('')
			return
		}

		let cancelled = false
		const timer = window.setTimeout(async () => {
			setEmployeeLoading(true)
			setEmployeeError('')

			try {
				const response = await fetch(
					`${API}/api/v1/employment/by-code/${encodeURIComponent(code)}`,
				)
				const result = await response.json()

				if (!response.ok) {
					throw new Error(
						typeof result?.detail === 'string'
							? result.detail
							: 'Employee not found',
					)
				}

				if (cancelled) return

				setValue('employee_code', result.employee_code ?? code)
				setValue('designation', result.designation ?? '')
				setValue('department', result.department ?? '')
			} catch (error) {
				if (cancelled) return
				setValue('designation', '')
				setValue('department', '')
				setEmployeeError(
					error instanceof Error ? error.message : 'Employee lookup failed',
				)
			} finally {
				if (!cancelled) setEmployeeLoading(false)
			}
		}, 400)

		return () => {
			cancelled = true
			window.clearTimeout(timer)
		}
	}, [employeeCode, setValue])

	const totalAdvance = Math.round(
		(budgets.reduce(
			(sum, item) => sum + Math.max(0, Number(item.amount) || 0),
			0,
		) +
			Math.max(0, Number(otherExpense) || 0) +
			Number.EPSILON) * 100,
	) / 100

	const updateBudget = (
		index: number,
		field: keyof BudgetItem,
		value: string,
	) => {
		setBudgets((current) =>
			current.map((item, i) =>
				i === index ? { ...item, [field]: value } : item,
			),
		)
	}

	const reviewForm = handleSubmit(() => {
		setMessage('')
		setErrorMessage('')
		if (employeeError || employeeLoading) {
			setErrorMessage('Please enter a valid Employee Code.')
			return
		}
		setReviewOpen(true)
	})

	const submitForm = async () => {
		const data = getValues()
		setSubmitting(true)
		setErrorMessage('')
		setMessage('')

		try {
			const response = await fetch(`${API}/travelling-advance/`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					employee_code: data.employee_code.trim().toUpperCase(),
					designation: data.designation,
					department: data.department,
					from_date: data.from_date || null,
					to_date: data.to_date || null,
					place_visited: data.place_to_be_visited,
					purpose_of_visit: data.purpose_of_visit,
					type_of_expense: budgets[0]?.type || '',
					expense_amount: Number(budgets[0]?.amount) || 0,
					additional_expense_type: budgets[1]?.type || '',
					additional_expense_amount: Number(budgets[1]?.amount) || 0,
					other_expense_type: [
						...budgets.slice(2).map((item) => item.type).filter(Boolean),
						...(otherExpense ? ['Other Expense'] : []),
					].join(', '),
					other_expense_amount:
						budgets.slice(2).reduce(
							(sum, item) => sum + (Number(item.amount) || 0),
							0,
						) + (Number(otherExpense) || 0),
					total_advance: totalAdvance,
				}),
			})

			const result = await response.json().catch(() => null)

			if (!response.ok) {
				throw new Error(
					typeof result?.detail === 'string'
						? result.detail
						: JSON.stringify(result?.detail ?? 'Failed to submit travelling advance'),
				)
			}

			setMessage('Travelling advance submitted successfully!')
			setReviewOpen(false)
		} catch (error) {
			setErrorMessage(
				error instanceof Error ? error.message : 'Something went wrong',
			)
		} finally {
			setSubmitting(false)
		}
	}

	const fieldProps = (name: keyof FormData) => ({
		...register(name),
		error: Boolean(errors[name]),
		helperText: errors[name]?.message,
		fullWidth: true,
	})

	return (
		<Paper sx={{ p: { xs: 2, md: 4 } }}>
			<Stack spacing={3}>
				<Typography variant="h5">Travelling Advance</Typography>

				{message && <Typography color="success.main">{message}</Typography>}
				{errorMessage && <Typography color="error">{errorMessage}</Typography>}

				<form onSubmit={(event) => {
					event.preventDefault()
					void reviewForm()
				}}>
					<Grid container spacing={2}>
						<Grid size={{ xs: 12, sm: 6 }}>
							<TextField
								{...fieldProps('employee_code')}
								label="Employee Code"
								required
							/>
							{employeeLoading && (
								<Typography variant="caption">Loading employee details...</Typography>
							)}
							{employeeError && (
								<Typography color="error" variant="caption">
									{employeeError}
								</Typography>
							)}
						</Grid>

						<Grid size={{ xs: 12, sm: 6 }}>
							<TextField
								{...fieldProps('designation')}
								label="Designation"
								slotProps={{ input: { readOnly: true }, inputLabel: { shrink: true } }}
							/>
						</Grid>

						<Grid size={{ xs: 12, sm: 6 }}>
							<TextField
								{...fieldProps('department')}
								label="Department"
								slotProps={{ input: { readOnly: true },inputLabel: { shrink: true } }}
							/>
						</Grid>

						<Grid size={{ xs: 12, sm: 6 }}>
							<TextField
								{...fieldProps('from_date')}
								label="From Date"
								type="date"
								slotProps={{ inputLabel: { shrink: true } }}
							/>
						</Grid>

						<Grid size={{ xs: 12, sm: 6 }}>
							<TextField
								{...fieldProps('to_date')}
								label="To Date"
								type="date"
								slotProps={{ inputLabel: { shrink: true } }}
							/>
						</Grid>

						<Grid size={{ xs: 12, sm: 6 }}>
							<TextField
								{...fieldProps('place_to_be_visited')}
								label="Place to be visited"
							/>
						</Grid>

						<Grid size={{ xs: 12 }}>
							<TextField
								{...fieldProps('purpose_of_visit')}
								label="Purpose of visit"
								multiline
								minRows={2}
							/>
						</Grid>

						<Grid size={{ xs: 12 }}>
							<Typography variant="h6">Type of Budget</Typography>
						</Grid>

						{budgets.map((budget, index) => (
							<Grid container spacing={2} key={index} size={{ xs: 12 }}>
								<Grid size={{ xs: 12, sm: 5 }}>
									<TextField
										label="Type of Budget"
										value={budget.type}
										onChange={(event) =>
											updateBudget(index, 'type', event.target.value)
										}
										fullWidth
									/>
								</Grid>
								<Grid size={{ xs: 10, sm: 5 }}>
									<TextField
										label="Amount (₹)"
										type="number"
										value={budget.amount}
										onChange={(event) =>
											updateBudget(index, 'amount', event.target.value)
										}
										slotProps={{ htmlInput: { min: 0, step: '100' } }}
										fullWidth
									/>
								</Grid>
								<Grid size={{ xs: 2, sm: 2 }}>
									<IconButton
										color="error"
										disabled={budgets.length === 1}
										onClick={() =>
											setBudgets((items) =>
												items.filter((_, i) => i !== index),
											)
										}
									>
										<Delete />
									</IconButton>
								</Grid>
							</Grid>
						))}

						<Grid size={{ xs: 12 }}>
							<Button
								type="button"
								startIcon={<Add />}
								onClick={() =>
									setBudgets((items) => [...items, { type: '', amount: '' }])
								}
							>
								Add Budget
							</Button>
						</Grid>

						<Grid size={{ xs: 12, sm: 6 }}>
							<TextField
							 label="Other ExpenseType"
							 value={otherExpenseType}
							 onChange={(e) => setOtherExpenseType(e.target.value)}
							 fullWidth
							/>
						</Grid>

						<Grid size={{ xs: 12, sm: 6 }}>
							<TextField
							 label="Other Expense Amount (₹)"
							 type="number"
							 value={otherExpense}
							 onChange={(e) => setOtherExpense(e.target.value)}
							 slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
							 fullWidth
							/>
						</Grid>

						<Grid size={{ xs: 12, sm: 6 }}>
							<TextField
								label="Total Advance in Rupees"
								value={`₹ ${totalAdvance.toFixed(2)}`}
								slotProps={{ input: { readOnly: true } }}
								fullWidth
							/>
						</Grid>

						<Grid size={{ xs: 12, sm: 6 }}>
							<TextField
								label="Value in Words"
								value={numberToWords(totalAdvance)}
								slotProps={{ input: { readOnly: true } }}
								fullWidth
							/>
						</Grid>

						<Grid size={{ xs: 12 }}>
							<Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
								<Button type="submit" variant="contained">
								 Review
								</Button>
								<HRBackButton />
							</Stack>
						</Grid>
					</Grid>
				</form>
			</Stack>

			<Dialog
				open={reviewOpen}
				onClose={() => setReviewOpen(false)}
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle>Travelling Advance Review</DialogTitle>
				<DialogContent dividers>
					<Stack spacing={1.5}>
						<Typography><b>Employee Code:</b> {getValues('employee_code')}</Typography>
						<Typography><b>Designation:</b> {getValues('designation')}</Typography>
						<Typography><b>Department:</b> {getValues('department')}</Typography>
						<Typography><b>From Date:</b> {getValues('from_date')}</Typography>
						<Typography><b>To Date:</b> {getValues('to_date')}</Typography>
						<Typography><b>Place to be visited:</b> {getValues('place_to_be_visited')}</Typography>
						<Typography><b>Purpose:</b> {getValues('purpose_of_visit')}</Typography>
						<Typography variant="h6">Budget Details</Typography>
						{budgets.map((item, index) => (
							<Typography key={index}>
								{item.type || `Budget ${index + 1}`} — ₹
								{(Number(item.amount) || 0).toFixed(2)}
							</Typography>
						))}
						<Typography>
							<b>Other Expense:</b> ₹{(Number(otherExpense) || 0).toFixed(2)}
						</Typography>
						<Typography><b>Total Advance:</b> ₹{totalAdvance.toFixed(2)}</Typography>
						<Typography><b>Value in Words:</b> {numberToWords(totalAdvance)}</Typography>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setReviewOpen(false)}>Back to Edit</Button>
					<Button
						variant="contained"
						disabled={submitting}
						onClick={() => void submitForm()}
					>
						{submitting ? 'Submitting...' : 'Submit'}
					</Button>
				</DialogActions>
			</Dialog>
		</Paper>
	)
}