import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Grid, Paper, Stack, TextField, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const optionalText = (max: number, label: string) =>
	z
		.string()
		.trim()
		.max(max, `${label} must be ${max} characters or less`)
		.optional()
		.or(z.literal(''))

const optionalLongText = z.string().trim().optional().or(z.literal(''))

const optionalDate = z
	.string()
	.refine((value) => {
		if (value === '') return true
		if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
		const [year, month, day] = value.split('-').map(Number)
		const date = new Date(year, month - 1, day)
		return (
			date.getFullYear() === year &&
			date.getMonth() === month - 1 &&
			date.getDate() === day
		)
	}, 'Enter a valid date')
	.optional()
	.or(z.literal(''))

const decimalSchema = (label: string) =>
	z
		.number()
		.finite(`${label} must be a valid number`)
		.refine(
			(value) => Math.abs(value) <= 9999999999.99,
			`${label} must fit Numeric(12, 2)`,
		)
		.refine(
			(value) =>
				Math.abs(value * 100 - Math.round(value * 100)) <=
				Number.EPSILON * Math.max(1, Math.abs(value * 100)),
			`${label} must have at most 2 decimal places`,
		)
		.optional()

const reimbursementSchema = z.object({
	user_id: z.number().int('User ID must be a whole number'),
	name: optionalText(150, 'Name'),
	employee_code: optionalText(50, 'Employee code'),
	designation: optionalText(150, 'Designation'),
	department: optionalText(150, 'Department'),
	from_date: optionalDate,
	to_date: optionalDate,
	place_visited: optionalText(200, 'Place visited'),
	purpose_of_visit: optionalLongText,
	expense_type1: optionalText(150, 'Expense type 1'),
	expense_amount1: decimalSchema('Expense amount 1'),
	attachment1: optionalLongText,
	expense_type2: optionalText(150, 'Expense type 2'),
	expense_amount2: decimalSchema('Expense amount 2'),
	attachment2: optionalLongText,
	other_expense_type: optionalText(150, 'Other expense type'),
	other_expense_amount: decimalSchema('Other expense amount'),
	attachment3: optionalLongText,
	total_amount: decimalSchema('Total amount'),
})

type ReimbursementFormData = z.infer<typeof reimbursementSchema>

const textFields = [
	{ name: 'name', label: 'Name', maxLength: 150 },
	{ name: 'employee_code', label: 'Employee code', maxLength: 50 },
	{ name: 'designation', label: 'Designation', maxLength: 150 },
	{ name: 'department', label: 'Department', maxLength: 150 },
	{ name: 'place_visited', label: 'Place visited', maxLength: 200 },
	{ name: 'expense_type1', label: 'Expense type 1', maxLength: 150 },
	{ name: 'expense_type2', label: 'Expense type 2', maxLength: 150 },
	{ name: 'other_expense_type', label: 'Other expense type', maxLength: 150 },
] as const

const dateFields = [
	{ name: 'from_date', label: 'From date' },
	{ name: 'to_date', label: 'To date' },
] as const

const decimalFields = [
	{ name: 'expense_amount1', label: 'Expense amount 1' },
	{ name: 'expense_amount2', label: 'Expense amount 2' },
	{ name: 'other_expense_amount', label: 'Other expense amount' },
	{ name: 'total_amount', label: 'Total amount' },
] as const

function TravellingExpensesReimbursementForm() {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ReimbursementFormData>({
		resolver: zodResolver(reimbursementSchema),
		defaultValues: {
			user_id: undefined,
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
			total_amount: undefined,
		},
	})

	const onSubmit = (_data: ReimbursementFormData) => undefined

	return (
		<Paper
			component="form"
			onSubmit={handleSubmit(onSubmit)}
			sx={{ p: { xs: 2, md: 4 } }}
		>
			<Stack spacing={3}>
				<div>
					<Typography variant="h5">Travelling expenses reimbursement</Typography>
					<Typography color="text.secondary" variant="body2">
						Capture travel details and reimbursable expenses.
					</Typography>
				</div>

				<Grid container spacing={2}>
					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('user_id', { valueAsNumber: true })}
							error={!!errors.user_id}
							helperText={errors.user_id?.message}
							label="User ID"
							type="number"
							required
							fullWidth
						/>
					</Grid>

					{textFields.map(({ name, label, maxLength }) => (
						<Grid key={name} size={{ xs: 12, sm: 6 }}>
							<TextField
								{...register(name)}
								error={!!errors[name]}
								helperText={errors[name]?.message}
								label={label}
								slotProps={{ htmlInput: { maxLength } }}
								fullWidth
							/>
						</Grid>
					))}

					{dateFields.map(({ name, label }) => (
						<Grid key={name} size={{ xs: 12, sm: 6 }}>
							<TextField
								{...register(name)}
								error={!!errors[name]}
								helperText={errors[name]?.message}
								label={label}
								type="date"
								slotProps={{ inputLabel: { shrink: true } }}
								fullWidth
							/>
						</Grid>
					))}

					<Grid size={{ xs: 12 }}>
						<TextField
							{...register('purpose_of_visit')}
							error={!!errors.purpose_of_visit}
							helperText={errors.purpose_of_visit?.message}
							label="Purpose of visit"
							multiline
							minRows={3}
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('attachment1')}
							error={!!errors.attachment1}
							helperText={errors.attachment1?.message}
							label="Attachment 1"
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('attachment2')}
							error={!!errors.attachment2}
							helperText={errors.attachment2?.message}
							label="Attachment 2"
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('attachment3')}
							error={!!errors.attachment3}
							helperText={errors.attachment3?.message}
							label="Attachment 3"
							fullWidth
						/>
					</Grid>

					{decimalFields.map(({ name, label }) => (
						<Grid key={name} size={{ xs: 12, sm: 6 }}>
							<TextField
								{...register(name, {
									setValueAs: (value) =>
										value === '' ? undefined : Number(value),
								})}
								error={!!errors[name]}
								helperText={errors[name]?.message}
								label={label}
								type="number"
								slotProps={{ htmlInput: { step: '0.01' } }}
								fullWidth
							/>
						</Grid>
					))}
				</Grid>

				<Button
					type="submit"
					variant="contained"
					sx={{ alignSelf: 'flex-start' }}
				>
					Submit reimbursement
				</Button>
			</Stack>
		</Paper>
	)
}

export default TravellingExpensesReimbursementForm
