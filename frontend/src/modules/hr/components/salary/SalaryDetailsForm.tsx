import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Grid, Paper, Stack, TextField, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

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

const optionalInteger = (label: string) =>
	z.number().int(`${label} must be a whole number`).optional()

const salaryDetailsSchema = z.object({
	user_id: z.number().int('User ID must be a whole number'),
	salary_offered_ctc: decimalSchema('Salary offered CTC'),
	yearly_increment: decimalSchema('Yearly increment'),
	increment_year: optionalInteger('Increment year'),
	basic: decimalSchema('Basic'),
	allowance1: decimalSchema('Allowance 1'),
	allowance2: decimalSchema('Allowance 2'),
	allowance3: decimalSchema('Allowance 3'),
	allowance4: decimalSchema('Allowance 4'),
	allowance5: decimalSchema('Allowance 5'),
	allowance6: decimalSchema('Allowance 6'),
	other_allowance: decimalSchema('Other allowance'),
	arrears: decimalSchema('Arrears'),
	gross: decimalSchema('Gross'),
	epf_deduction: decimalSchema('EPF deduction'),
	esi_insurance_deduction: decimalSchema('ESI insurance deduction'),
	tds: decimalSchema('TDS'),
	canteen_deduction: decimalSchema('Canteen deduction'),
	advance_deduction: decimalSchema('Advance deduction'),
	loan_emi: decimalSchema('Loan EMI'),
	other_deduction: decimalSchema('Other deduction'),
	total_deductions: decimalSchema('Total deductions'),
	net_salary: decimalSchema('Net salary'),
	epf_employer_share: decimalSchema('EPF employer share'),
	esi_employer_share: decimalSchema('ESI employer share'),
	insurance_employer_share: decimalSchema('Insurance employer share'),
	transport_allowance: decimalSchema('Transport allowance'),
	canteen_allowance: decimalSchema('Canteen allowance'),
	bonus: decimalSchema('Bonus'),
	other_employer_contribution: decimalSchema('Other employer contribution'),
	total_ctc: decimalSchema('Total CTC'),
})

type SalaryDetailsFormData = z.infer<typeof salaryDetailsSchema>

type NumericField = {
	name: keyof Omit<SalaryDetailsFormData, 'user_id'>
	label: string
	integer?: boolean
}

const salaryFields: NumericField[] = [
	{ name: 'salary_offered_ctc', label: 'Salary offered CTC' },
	{ name: 'yearly_increment', label: 'Yearly increment' },
	{ name: 'increment_year', label: 'Increment year', integer: true },
	{ name: 'basic', label: 'Basic' },
	{ name: 'allowance1', label: 'Allowance 1' },
	{ name: 'allowance2', label: 'Allowance 2' },
	{ name: 'allowance3', label: 'Allowance 3' },
	{ name: 'allowance4', label: 'Allowance 4' },
	{ name: 'allowance5', label: 'Allowance 5' },
	{ name: 'allowance6', label: 'Allowance 6' },
	{ name: 'other_allowance', label: 'Other allowance' },
	{ name: 'arrears', label: 'Arrears' },
	{ name: 'gross', label: 'Gross' },
]

const deductionFields: NumericField[] = [
	{ name: 'epf_deduction', label: 'EPF deduction' },
	{ name: 'esi_insurance_deduction', label: 'ESI insurance deduction' },
	{ name: 'tds', label: 'TDS' },
	{ name: 'canteen_deduction', label: 'Canteen deduction' },
	{ name: 'advance_deduction', label: 'Advance deduction' },
	{ name: 'loan_emi', label: 'Loan EMI' },
	{ name: 'other_deduction', label: 'Other deduction' },
	{ name: 'total_deductions', label: 'Total deductions' },
	{ name: 'net_salary', label: 'Net salary' },
]

const contributionFields: NumericField[] = [
	{ name: 'epf_employer_share', label: 'EPF employer share' },
	{ name: 'esi_employer_share', label: 'ESI employer share' },
	{ name: 'insurance_employer_share', label: 'Insurance employer share' },
	{ name: 'transport_allowance', label: 'Transport allowance' },
	{ name: 'canteen_allowance', label: 'Canteen allowance' },
	{ name: 'bonus', label: 'Bonus' },
	{ name: 'other_employer_contribution', label: 'Other employer contribution' },
	{ name: 'total_ctc', label: 'Total CTC' },
]

function SalaryDetailsForm() {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<SalaryDetailsFormData>({
		resolver: zodResolver(salaryDetailsSchema),
		defaultValues: {
			user_id: undefined,
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

	const onSubmit = (_data: SalaryDetailsFormData) => undefined

	return (
		<Paper
			component="form"
			onSubmit={handleSubmit(onSubmit)}
			sx={{ p: { xs: 2, md: 4 } }}
		>
			<Stack spacing={3}>
				<div>
					<Typography variant="h5">Salary details</Typography>
					<Typography color="text.secondary" variant="body2">
						Capture salary, deduction, and employer contribution details.
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
				</Grid>

				{[
					{ title: 'Salary and earnings', fields: salaryFields },
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
										slotProps={{
											htmlInput: { step: integer ? 1 : '0.01' },
										}}
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
					Submit salary details
				</Button>
			</Stack>
		</Paper>
	)
}

export default SalaryDetailsForm
