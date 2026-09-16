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

const optionalNumber = (label: string) =>
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

const optionalInteger = (label: string) =>
	z.number().int(`${label} must be a whole number`).optional()

const onEmploymentSchema = z.object({
	employee_refno_id: z.number().int('Employee reference ID must be a whole number'),
	employee_code: optionalText(50, 'Employee code'),
	designation: optionalText(150, 'Designation'),
	department: optionalText(150, 'Department'),
	immediate_reporting_head: optionalText(150, 'Immediate reporting head'),
	department_head: optionalText(150, 'Department head'),
	epf_uan: optionalText(50, 'EPF UAN'),
	esi: optionalText(50, 'ESI'),
	health_insurance: optionalText(150, 'Health insurance'),
	health_insurance_date: optionalDate,
	work_email: z
		.string()
		.trim()
		.max(150, 'Work email must be 150 characters or less')
		.email('Enter a valid email address')
		.optional()
		.or(z.literal('')),
	bank_account_name: optionalText(150, 'Bank account name'),
	account_no: optionalText(50, 'Account number'),
	bank: optionalText(150, 'Bank'),
	branch: optionalText(150, 'Branch'),
	ifsc: optionalText(20, 'IFSC'),
	salary_offered_ctc: optionalNumber('Salary offered CTC'),
	yearly_increment: optionalNumber('Yearly increment'),
	increment_year: optionalInteger('Increment year'),
	basic: optionalNumber('Basic'),
	allowance1: optionalNumber('Allowance 1'),
	allowance2: optionalNumber('Allowance 2'),
	allowance3: optionalNumber('Allowance 3'),
	allowance4: optionalNumber('Allowance 4'),
	allowance5: optionalNumber('Allowance 5'),
	allowance6: optionalNumber('Allowance 6'),
	other_allowance: optionalNumber('Other allowance'),
	arrears: optionalNumber('Arrears'),
	gross: optionalNumber('Gross'),
	epf_deduction: optionalNumber('EPF deduction'),
	esi_insurance_deduction: optionalNumber('ESI insurance deduction'),
	tds: optionalNumber('TDS'),
	canteen_deduction: optionalNumber('Canteen deduction'),
	advance_deduction: optionalNumber('Advance deduction'),
	loan_emi: optionalNumber('Loan EMI'),
	other_deduction: optionalNumber('Other deduction'),
	total_deductions: optionalNumber('Total deductions'),
	net_salary: optionalNumber('Net salary'),
	epf_employer_share: optionalNumber('EPF employer share'),
	esi_employer_share: optionalNumber('ESI employer share'),
	insurance_employer_share: optionalNumber('Insurance employer share'),
	transport_allowance: optionalNumber('Transport allowance'),
	canteen_allowance: optionalNumber('Canteen allowance'),
	bonus: optionalNumber('Bonus'),
	other_employer_contribution: optionalNumber('Other employer contribution'),
	total_ctc: optionalNumber('Total CTC'),
})

type OnEmploymentFormData = z.infer<typeof onEmploymentSchema>

const textFields = [
	{ name: 'employee_code', label: 'Employee code', maxLength: 50 },
	{ name: 'designation', label: 'Designation', maxLength: 150 },
	{ name: 'department', label: 'Department', maxLength: 150 },
	{
		name: 'immediate_reporting_head',
		label: 'Immediate reporting head',
		maxLength: 150,
	},
	{ name: 'department_head', label: 'Department head', maxLength: 150 },
	{ name: 'epf_uan', label: 'EPF UAN', maxLength: 50 },
	{ name: 'esi', label: 'ESI', maxLength: 50 },
	{ name: 'health_insurance', label: 'Health insurance', maxLength: 150 },
	{ name: 'bank_account_name', label: 'Bank account name', maxLength: 150 },
	{ name: 'account_no', label: 'Account number', maxLength: 50 },
	{ name: 'bank', label: 'Bank', maxLength: 150 },
	{ name: 'branch', label: 'Branch', maxLength: 150 },
	{ name: 'ifsc', label: 'IFSC', maxLength: 20 },
] as const

const salaryFields = [
	{ name: 'salary_offered_ctc', label: 'Salary offered CTC', integer: false },
	{ name: 'yearly_increment', label: 'Yearly increment', integer: false },
	{ name: 'increment_year', label: 'Increment year', integer: true },
	{ name: 'basic', label: 'Basic', integer: false },
	{ name: 'allowance1', label: 'Allowance 1', integer: false },
	{ name: 'allowance2', label: 'Allowance 2', integer: false },
	{ name: 'allowance3', label: 'Allowance 3', integer: false },
	{ name: 'allowance4', label: 'Allowance 4', integer: false },
	{ name: 'allowance5', label: 'Allowance 5', integer: false },
	{ name: 'allowance6', label: 'Allowance 6', integer: false },
	{ name: 'other_allowance', label: 'Other allowance', integer: false },
	{ name: 'arrears', label: 'Arrears', integer: false },
	{ name: 'gross', label: 'Gross', integer: false },
] as const

const deductionFields = [
	{ name: 'epf_deduction', label: 'EPF deduction', integer: false },
	{ name: 'esi_insurance_deduction', label: 'ESI insurance deduction', integer: false },
	{ name: 'tds', label: 'TDS', integer: false },
	{ name: 'canteen_deduction', label: 'Canteen deduction', integer: false },
	{ name: 'advance_deduction', label: 'Advance deduction', integer: false },
	{ name: 'loan_emi', label: 'Loan EMI', integer: false },
	{ name: 'other_deduction', label: 'Other deduction', integer: false },
	{ name: 'total_deductions', label: 'Total deductions', integer: false },
	{ name: 'net_salary', label: 'Net salary', integer: false },
] as const

const contributionFields = [
	{ name: 'epf_employer_share', label: 'EPF employer share', integer: false },
	{ name: 'esi_employer_share', label: 'ESI employer share', integer: false },
	{ name: 'insurance_employer_share', label: 'Insurance employer share', integer: false },
	{ name: 'transport_allowance', label: 'Transport allowance', integer: false },
	{ name: 'canteen_allowance', label: 'Canteen allowance', integer: false },
	{ name: 'bonus', label: 'Bonus', integer: false },
	{ name: 'other_employer_contribution', label: 'Other employer contribution', integer: false },
	{ name: 'total_ctc', label: 'Total CTC', integer: false },
] as const

function OnEmploymentForm() {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<OnEmploymentFormData>({
		resolver: zodResolver(onEmploymentSchema),
		defaultValues: {
			employee_refno_id: undefined,
			employee_code: '',
			designation: '',
			department: '',
			immediate_reporting_head: '',
			department_head: '',
			epf_uan: '',
			esi: '',
			health_insurance: '',
			health_insurance_date: '',
			work_email: '',
			bank_account_name: '',
			account_no: '',
			bank: '',
			branch: '',
			ifsc: '',
			salary_offered_ctc: undefined,
			yearly_increment: undefined,
			increment_year: undefined,
			basic: undefined,
			allowance1: undefined,
			allowance2: undefined,
			allowance3: undefined,
			allowance4: undefined,
			allowance5: undefined,
			allowance6: undefined,
			other_allowance: undefined,
			arrears: undefined,
			gross: undefined,
			epf_deduction: undefined,
			esi_insurance_deduction: undefined,
			tds: undefined,
			canteen_deduction: undefined,
			advance_deduction: undefined,
			loan_emi: undefined,
			other_deduction: undefined,
			total_deductions: undefined,
			net_salary: undefined,
			epf_employer_share: undefined,
			esi_employer_share: undefined,
			insurance_employer_share: undefined,
			transport_allowance: undefined,
			canteen_allowance: undefined,
			bonus: undefined,
			other_employer_contribution: undefined,
			total_ctc: undefined,
		},
	})

	const onSubmit = (_data: OnEmploymentFormData) => undefined

	return (
		<Paper
			component="form"
			onSubmit={handleSubmit(onSubmit)}
			sx={{ p: { xs: 2, md: 4 } }}
		>
			<Stack spacing={3}>
				<div>
					<Typography variant="h5">On employment</Typography>
					<Typography color="text.secondary" variant="body2">
						Capture employment, salary, deduction, and contribution details.
					</Typography>
				</div>

				<Stack spacing={2}>
					<Typography variant="h6">Employee and banking details</Typography>
					<Grid container spacing={2}>
						<Grid size={{ xs: 12, sm: 6 }}>
							<TextField
								{...register('employee_refno_id', { valueAsNumber: true })}
								error={!!errors.employee_refno_id}
								helperText={errors.employee_refno_id?.message}
								label="Employee reference ID"
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

						<Grid size={{ xs: 12, sm: 6 }}>
							<TextField
								{...register('health_insurance_date')}
								error={!!errors.health_insurance_date}
								helperText={errors.health_insurance_date?.message}
								label="Health insurance date"
								type="date"
								slotProps={{ inputLabel: { shrink: true } }}
								fullWidth
							/>
						</Grid>

						<Grid size={{ xs: 12, sm: 6 }}>
							<TextField
								{...register('work_email')}
								error={!!errors.work_email}
								helperText={errors.work_email?.message}
								label="Work email"
								type="email"
								slotProps={{ htmlInput: { maxLength: 150 } }}
								fullWidth
							/>
						</Grid>
					</Grid>
				</Stack>

				{[
					{ title: 'Salary details', fields: salaryFields },
					{ title: 'Deductions', fields: deductionFields },
					{ title: 'Employer contributions', fields: contributionFields },
				].map(({ title, fields }) => (
					<Stack key={title} spacing={2}>
						<Typography variant="h6">{title}</Typography>
						<Grid container spacing={2}>
							{fields.map(({ name, label, integer }) => (
								<Grid key={name} size={{ xs: 12, sm: 6, md: 4 }}>
									<TextField
										{...register(name, {
											setValueAs: (value) =>
												value === '' ? undefined : Number(value),
										})}
										error={!!errors[name]}
										helperText={errors[name]?.message}
										label={label}
										type="number"
										slotProps={{ htmlInput: { step: integer ? 1 : '0.01' } }}
										fullWidth
									/>
								</Grid>
							))}
						</Grid>
					</Stack>
				))}

				<Button
					type="submit"
					variant="contained"
					sx={{ alignSelf: 'flex-start' }}
				>
					Submit on-employment details
				</Button>
			</Stack>
		</Paper>
	)
}

export default OnEmploymentForm
