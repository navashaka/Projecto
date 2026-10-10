import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import HRBackButton from '../HRBackButton'

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
	employee_refno_id: z
		.number()
		.int('Employee reference ID must be a whole number'),

	employee_code: optionalText(50, 'Employee code'),
	designation: optionalText(150, 'Designation'),
	department: optionalText(150, 'Department'),
	immediate_reporting_head: optionalText(
		150,
		'Immediate reporting head',
	),
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

	bank_account_name: optionalText(
		150,
		'Bank account name',
	),
	account_no: optionalText(50, 'Account number'),
	bank: optionalText(150, 'Bank'),
	branch: optionalText(150, 'Branch'),
	ifsc: optionalText(20, 'IFSC'),

	salary_offered_ctc: optionalNumber(
		'Salary offered CTC',
	),
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
	esi_insurance_deduction: optionalNumber(
		'ESI insurance deduction',
	),
	tds: optionalNumber('TDS'),
	canteen_deduction: optionalNumber(
		'Canteen deduction',
	),
	advance_deduction: optionalNumber(
		'Advance deduction',
	),
	loan_emi: optionalNumber('Loan EMI'),
	other_deduction: optionalNumber('Other deduction'),
	total_deductions: optionalNumber(
		'Total deductions',
	),
	net_salary: optionalNumber('Net salary'),

	epf_employer_share: optionalNumber(
		'EPF employer share',
	),
	esi_employer_share: optionalNumber(
		'ESI employer share',
	),
	insurance_employer_share: optionalNumber(
		'Insurance employer share',
	),
	transport_allowance: optionalNumber(
		'Transport allowance',
	),
	canteen_allowance: optionalNumber(
		'Canteen allowance',
	),
	bonus: optionalNumber('Bonus'),
	other_employer_contribution: optionalNumber(
		'Other employer contribution',
	),
	total_ctc: optionalNumber('Total CTC'),
})

type OnEmploymentFormData = z.infer<
	typeof onEmploymentSchema
>

const textFields = [
	['employee_code', 'Employee code'],
	['designation', 'Designation'],
	['department', 'Department'],
	[
		'immediate_reporting_head',
		'Immediate reporting head',
	],
	['department_head', 'Department head'],
	['epf_uan', 'EPF UAN'],
	['esi', 'ESI'],
	['health_insurance', 'Health insurance'],
	['bank_account_name', 'Bank account name'],
	['account_no', 'Account number'],
	['bank', 'Bank'],
	['branch', 'Branch'],
	['ifsc', 'IFSC'],
] as const

const salaryFields = [
	['salary_offered_ctc', 'Salary offered CTC', false],
	['yearly_increment', 'Yearly increment', false],
	['increment_year', 'Increment year', true],
	['basic', 'Basic', false],
	['allowance1', 'Allowance 1', false],
	['allowance2', 'Allowance 2', false],
	['allowance3', 'Allowance 3', false],
	['allowance4', 'Allowance 4', false],
	['allowance5', 'Allowance 5', false],
	['allowance6', 'Allowance 6', false],
	['other_allowance', 'Other allowance', false],
	['arrears', 'Arrears', false],
	['gross', 'Gross', false],
] as const

const deductionFields = [
	['epf_deduction', 'EPF deduction'],
	[
		'esi_insurance_deduction',
		'ESI insurance deduction',
	],
	['tds', 'TDS'],
	['canteen_deduction', 'Canteen deduction'],
	['advance_deduction', 'Advance deduction'],
	['loan_emi', 'Loan EMI'],
	['other_deduction', 'Other deduction'],
	['total_deductions', 'Total deductions'],
	['net_salary', 'Net salary'],
] as const

const contributionFields = [
	['epf_employer_share', 'EPF employer share'],
	['esi_employer_share', 'ESI employer share'],
	[
		'insurance_employer_share',
		'Insurance employer share',
	],
	['transport_allowance', 'Transport allowance'],
	['canteen_allowance', 'Canteen allowance'],
	['bonus', 'Bonus'],
	[
		'other_employer_contribution',
		'Other employer contribution',
	],
	['total_ctc', 'Total CTC'],
] as const

const roundValue = (value: number) =>
	Math.round(value)

const getValue = (value: number | undefined) =>
	value ?? 0

function OnEmploymentForm() {
	const [successMessage, setSuccessMessage] =
		useState('')
	const [apiError, setApiError] = useState('')
	const [isSubmitting, setIsSubmitting] =
		useState(false)

	const {
		register,
		handleSubmit,
		control,
		setValue,
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

	const values = useWatch({ control })

	/* =========================
	   AUTOMATIC CALCULATIONS
	   ========================= */

	useEffect(() => {
		const basic = getValue(values.basic)

		const allowances =
			getValue(values.allowance1) +
			getValue(values.allowance2) +
			getValue(values.allowance3) +
			getValue(values.allowance4) +
			getValue(values.allowance5) +
			getValue(values.allowance6) +
			getValue(values.other_allowance)

		// Gross = Basic + Allowances
		const gross = roundValue(
			basic + allowances,
		)

		setValue('gross', gross)

		// Employee EPF = 12% of Basic
		const epf = roundValue(
			basic * 0.12,
		)

		setValue('epf_deduction', epf)

		// Employee ESI = 0.75% of Gross
		// only when Gross <= 21000
		const esi =
			gross <= 21000
				? roundValue(
						gross * 0.0075,
					)
				: 0

		setValue(
			'esi_insurance_deduction',
			esi,
		)

		// Total deductions
		const totalDeductions =
			roundValue(
				epf +
					esi +
					getValue(values.tds) +
					getValue(
						values.canteen_deduction,
					) +
					getValue(
						values.advance_deduction,
					) +
					getValue(values.loan_emi) +
					getValue(
						values.other_deduction,
					),
			)

		setValue(
			'total_deductions',
			totalDeductions,
		)

		// Net salary
		const netSalary = roundValue(
			gross - totalDeductions,
		)

		setValue(
			'net_salary',
			netSalary,
		)

		// Employer EPF = 3.67% of Basic
		const employerEpf =
			roundValue(
				basic * 0.0367,
			)

		setValue(
			'epf_employer_share',
			employerEpf,
		)

		// Employer ESI = 3.25% of Gross
		// only when Gross <= 21000
		const employerEsi =
			gross <= 21000
				? roundValue(
						gross * 0.0325,
					)
				: 0

		setValue(
			'esi_employer_share',
			employerEsi,
		)

		// Total CTC
		const totalCtc =
			roundValue(
				gross +
					employerEpf +
					employerEsi +
					getValue(
						values.insurance_employer_share,
					) +
					getValue(
						values.transport_allowance,
					) +
					getValue(
						values.canteen_allowance,
					) +
					getValue(values.bonus) +
					getValue(
						values.other_employer_contribution,
					),
			)

		setValue(
			'total_ctc',
			totalCtc,
		)
	}, [
		values.basic,
		values.allowance1,
		values.allowance2,
		values.allowance3,
		values.allowance4,
		values.allowance5,
		values.allowance6,
		values.other_allowance,
		values.tds,
		values.canteen_deduction,
		values.advance_deduction,
		values.loan_emi,
		values.other_deduction,
		values.insurance_employer_share,
		values.transport_allowance,
		values.canteen_allowance,
		values.bonus,
		values.other_employer_contribution,
		setValue,
	])

	/* =========================
	   SUBMIT TO BACKEND
	   ========================= */

	const onSubmit = async (
		data: OnEmploymentFormData,
	) => {
		setSuccessMessage('')
		setApiError('')
		setIsSubmitting(true)

		try {
			const response = await fetch(
				'http://127.0.0.1:8000/on-employment/',
				{
					method: 'POST',
					headers: {
						'Content-Type':
							'application/json',
					},
					body: JSON.stringify(data),
				},
			)

			const responseData =
				await response
					.json()
					.catch(() => null)

			if (!response.ok) {
				const message =
					responseData?.detail
						? typeof responseData.detail ===
							'string'
							? responseData.detail
							: JSON.stringify(
									responseData.detail,
								)
						: 'Failed to submit On Employment details.'

				throw new Error(message)
			}

			setSuccessMessage(
				'Submitted successfully!',
			)
		} catch (error) {
			setApiError(
				error instanceof Error
					? error.message
					: 'Something went wrong while submitting.',
			)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="enquiry-page bg-light min-vh-100 py-5">
			<div className="container">
				<div className="card shadow-sm border-0">
					<div className="card-body p-4 p-lg-5">

						<div className="mb-4">
							<p className="text-uppercase text-primary fw-semibold mb-1">
								HR Management
							</p>

							<h1 className="h2 mb-1">
								On Employment Details
							</h1>

							<p className="text-muted mb-0">
								Capture employee employment,
								banking, salary, deduction
								and employer contribution
								details.
							</p>
						</div>

						{successMessage && (
							<div className="alert alert-success">
								{successMessage}
							</div>
						)}

						{apiError && (
							<div className="alert alert-danger">
								{apiError}
							</div>
						)}

						<form
							className="row g-3"
							onSubmit={handleSubmit(
								onSubmit,
							)}
							noValidate
						>

							{/* Employee & Banking */}
							<div className="col-12 border rounded bg-white p-3 p-md-4 mb-3">
								<h2 className="h4 mb-3">
									Employee and Banking Details
								</h2>

								<div className="row g-3">

									<div className="col-12 col-md-6 col-lg-4">
										<label className="form-label fw-semibold">
											Employee Reference ID *
										</label>

										<input
											type="number"
											className={
												errors.employee_refno_id
													? 'form-control is-invalid'
													: 'form-control'
											}
											{...register(
												'employee_refno_id',
												{
													valueAsNumber:
														true,
												},
											)}
										/>

										{errors.employee_refno_id && (
											<div className="invalid-feedback d-block">
												{
													errors
														.employee_refno_id
														.message
												}
											</div>
										)}
									</div>

									{textFields.map(
										([name, label]) => (
											<div
												className="col-12 col-md-6 col-lg-4"
												key={name}
											>
												<label className="form-label fw-semibold">
													{label}
												</label>

												<input
													type="text"
													className="form-control"
													{...register(
														name as any,
													)}
												/>
											</div>
										),
									)}

									<div className="col-12 col-md-6 col-lg-4">
										<label className="form-label fw-semibold">
											Health insurance date
										</label>

										<input
											type="date"
											className="form-control"
											{...register(
												'health_insurance_date',
											)}
										/>
									</div>

									<div className="col-12 col-md-6 col-lg-4">
										<label className="form-label fw-semibold">
											Work email
										</label>

										<input
											type="email"
											className={
												errors.work_email
													? 'form-control is-invalid'
													: 'form-control'
											}
											{...register(
												'work_email',
											)}
										/>

										{errors.work_email && (
											<div className="invalid-feedback d-block">
												{
													errors
														.work_email
														.message
												}
											</div>
										)}
									</div>

								</div>
							</div>

							{/* Salary */}
							<div className="col-12 border rounded bg-white p-3 p-md-4 mb-3">
								<h2 className="h4 mb-3">
									Salary Details
								</h2>

								<div className="row g-3">
									{salaryFields.map(
										([
											name,
											label,
											integer,
										]) => {
											const calculated =
												[
													'gross',
												].includes(
													name,
												)

											return (
												<div
													className="col-12 col-md-6 col-lg-4"
													key={name}
												>
													<label className="form-label fw-semibold">
														{label}
													</label>

													<input
														type="number"
														step={
															integer
																? '1'
																: '0.01'
														}
														readOnly={
															calculated
														}
														className={
															calculated
																? 'form-control bg-light'
																: 'form-control'
														}
														{...register(
															name as any,
															{
																setValueAs:
																	(
																		value,
																	) =>
																		value ===
																		''
																			? undefined
																			: Number(
																					value,
																				),
															},
														)}
													/>
												</div>
											)
										},
									)}
								</div>
							</div>

							{/* Deductions */}
							<div className="col-12 border rounded bg-white p-3 p-md-4 mb-3">
								<h2 className="h4 mb-3">
									Employee Deductions
								</h2>

								<div className="row g-3">
									{deductionFields.map(
										([name, label]) => {
											const calculated =
												[
													'epf_deduction',
													'esi_insurance_deduction',
													'total_deductions',
													'net_salary',
												].includes(
													name,
												)

											return (
												<div
													className="col-12 col-md-6 col-lg-4"
													key={name}
												>
													<label className="form-label fw-semibold">
														{label}
													</label>

													<input
														type="number"
														step="0.01"
														readOnly={
															calculated
														}
														className={
															calculated
																? 'form-control bg-light'
																: 'form-control'
														}
														{...register(
															name as any,
															{
																setValueAs:
																	(
																		value,
																	) =>
																		value ===
																		''
																			? undefined
																			: Number(
																					value,
																				),
															},
														)}
													/>
												</div>
											)
										},
									)}
								</div>
							</div>

							{/* Employer Contributions */}
							<div className="col-12 border rounded bg-white p-3 p-md-4 mb-3">
								<h2 className="h4 mb-3">
									Employer Contributions
								</h2>

								<div className="row g-3">
									{contributionFields.map(
										([name, label]) => {
											const calculated =
												[
													'epf_employer_share',
													'esi_employer_share',
													'total_ctc',
												].includes(
													name,
												)

											return (
												<div
													className="col-12 col-md-6 col-lg-4"
													key={name}
												>
													<label className="form-label fw-semibold">
														{label}
													</label>

													<input
														type="number"
														step="0.01"
														readOnly={
															calculated
														}
														className={
															calculated
																? 'form-control bg-light'
																: 'form-control'
														}
														{...register(
															name as any,
															{
																setValueAs:
																	(
																		value,
																	) =>
																		value ===
																		''
																			? undefined
																			: Number(
																					value,
																				),
															},
														)}
													/>
												</div>
											)
										},
									)}
								</div>
							</div>

							{/* Submit */}
							<div className="col-12 d-flex justify-content-end gap-2">
								<button
									type="submit"
									className="btn btn-primary btn-lg px-4"
									disabled={
										isSubmitting
									}
								>
									{isSubmitting
										? 'Submitting...'
										: 'Submit'}
								</button>
								<HRBackButton />
							</div>

						</form>
					</div>
				</div>
			</div>
		</div>
	)
}

export default OnEmploymentForm