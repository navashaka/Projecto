import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import * as XLSX from 'xlsx'
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
		.int('Employee reference ID must be a whole number')
		.positive('Employee reference ID must be positive'),

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

const ON_EMPLOYMENT_API_URL = 'http://localhost:8000/on-employment/'

const onEmploymentExcelHeaders = Object.keys(
	onEmploymentSchema.shape,
) as (keyof OnEmploymentFormData)[]

async function submitOnEmploymentRow(data: OnEmploymentFormData) {
	let response: Response
	try {
		response = await fetch(ON_EMPLOYMENT_API_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		})
	} catch (error) {
		const cause = error instanceof Error
			? `${error.name}: ${error.message}`
			: String(error)
		const origin = typeof window === 'undefined' ? 'unknown origin' : window.location.origin
		throw new Error(
			`Network request to ${ON_EMPLOYMENT_API_URL} from ${origin} failed (${cause}). Check that the backend is reachable and its CORS configuration allows this origin.`,
		)
	}

	let responseBody: string
	try {
		responseBody = await response.text()
	} catch (error) {
		const cause = error instanceof Error
			? `${error.name}: ${error.message}`
			: String(error)
		const origin = typeof window === 'undefined' ? 'unknown origin' : window.location.origin
		throw new Error(
			`Network error reading response from ${ON_EMPLOYMENT_API_URL} for ${origin} (${cause}). Check backend availability and CORS configuration.`,
		)
	}
	let responseData: unknown = null
	if (responseBody) {
		try {
			responseData = JSON.parse(responseBody)
		} catch {
			responseData = responseBody
		}
	}

	if (!response.ok) {
		const detail =
			typeof responseData === 'object' && responseData !== null && 'detail' in responseData
				? responseData.detail
				: responseData
		const message = typeof detail === 'string'
			? detail
			: detail == null
				? responseBody || response.statusText
				: JSON.stringify(detail)
		throw new Error(`HTTP ${response.status}: ${message || 'Request failed.'}`)
	}
}

function formatExcelDate(value: unknown): string | undefined {
	if (value === '' || value == null) return undefined

	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		return value.toISOString().slice(0, 10)
	}

	if (typeof value === 'number') {
		const date = XLSX.SSF.parse_date_code(value)
		if (date) {
			return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`
		}
	}

	return String(value).trim()
}

function normalizeExcelHeader(value: unknown): string {
	return String(value ?? '')
		.trim()
		.toLowerCase()
		.replace(/[\s-]+/g, '_')
}

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

const onEmploymentNumericHeaders = new Set<string>([
	'employee_refno_id',
	...salaryFields.map(([name]) => name),
	...deductionFields.map(([name]) => name),
	...contributionFields.map(([name]) => name),
])

const roundValue = (value: number) =>
	Math.round(value)

const getValue = (value: number | undefined) =>
	value ?? 0

function calculateOnEmploymentRow(
	row: OnEmploymentFormData,
): OnEmploymentFormData {
	const basic = getValue(row.basic)
	const gross = roundValue(
		basic +
			getValue(row.allowance1) +
			getValue(row.allowance2) +
			getValue(row.allowance3) +
			getValue(row.allowance4) +
			getValue(row.allowance5) +
			getValue(row.allowance6) +
			getValue(row.other_allowance),
	)
	const epf = roundValue(basic * 0.12)
	const esi = gross <= 21000 ? roundValue(gross * 0.0075) : 0
	const totalDeductions = roundValue(
		epf +
			esi +
			getValue(row.tds) +
			getValue(row.canteen_deduction) +
			getValue(row.advance_deduction) +
			getValue(row.loan_emi) +
			getValue(row.other_deduction),
	)
	const employerEpf = roundValue(basic * 0.0367)
	const employerEsi = gross <= 21000 ? roundValue(gross * 0.0325) : 0

	return {
		...row,
		gross,
		epf_deduction: epf,
		esi_insurance_deduction: esi,
		total_deductions: totalDeductions,
		net_salary: roundValue(gross - totalDeductions),
		epf_employer_share: employerEpf,
		esi_employer_share: employerEsi,
		total_ctc: roundValue(
			gross +
				employerEpf +
				employerEsi +
				getValue(row.insurance_employer_share) +
				getValue(row.transport_allowance) +
				getValue(row.canteen_allowance) +
				getValue(row.bonus) +
				getValue(row.other_employer_contribution),
		),
	}
}

function OnEmploymentForm() {
	const [successMessage, setSuccessMessage] =
		useState('')
	const [apiError, setApiError] = useState('')
	const [isSubmitting, setIsSubmitting] =
		useState(false)
	const [excelRows, setExcelRows] = useState<OnEmploymentFormData[]>([])
	const [excelRowNumbers, setExcelRowNumbers] = useState<number[]>([])
	const [excelErrors, setExcelErrors] = useState<string[]>([])
	const [isSavingExcel, setIsSavingExcel] = useState(false)

	const {
		register,
		handleSubmit,
		control,
		setValue,
		formState: { errors },
	} = useForm<OnEmploymentFormData>({
		resolver: zodResolver(onEmploymentSchema),
		mode: 'onChange',
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

	const fieldError = (name: keyof OnEmploymentFormData) => {
		const message = errors[name]?.message
		return typeof message === 'string' ? message : undefined
	}

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
			await submitOnEmploymentRow(data)

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

	const handleExcelSelect = async (file?: File) => {
		setExcelRows([])
		setExcelRowNumbers([])
		setExcelErrors([])
		setSuccessMessage('')
		setApiError('')

		if (!file) return
		if (!/\.(xlsx|xls)$/i.test(file.name)) {
			setExcelErrors(['Select an Excel file (.xlsx or .xls).'])
			return
		}

		try {
			const workbook = XLSX.read(await file.arrayBuffer(), {
				type: 'array',
				cellDates: true,
			})
			const sheetName = workbook.SheetNames[0]
			const sheet = sheetName ? workbook.Sheets[sheetName] : undefined
			if (!sheet) throw new Error('Excel worksheet not found.')

			const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
				header: 1,
				defval: '',
				raw: true,
			})
			if (rows.length < 2) {
				throw new Error('Excel file has no data rows.')
			}

			const headers = rows[0].map(normalizeExcelHeader)
			const duplicated = headers.filter(
				(header, index) => header && headers.indexOf(header) !== index,
			)
			if (duplicated.length) {
				throw new Error(
					`Duplicate Excel columns: ${[...new Set(duplicated)].join(', ')}.`,
				)
			}

			const supportedHeaders = new Set<string>(onEmploymentExcelHeaders)
			const missingHeaders = ['employee_refno_id'].filter(
				(header) => !headers.includes(header),
			)
			const unsupportedHeaders = headers.filter(
				(header) => header && !supportedHeaders.has(header),
			)
			if (missingHeaders.length || unsupportedHeaders.length) {
				throw new Error(
					[
						...(missingHeaders.length
							? [`Missing required columns: ${missingHeaders.join(', ')}`]
							: []),
						...(unsupportedHeaders.length
							? [`Unsupported columns: ${unsupportedHeaders.join(', ')}`]
							: []),
					].join('. '),
				)
			}

			const validationErrors: string[] = []
			const validRows: OnEmploymentFormData[] = []
			const validRowNumbers: number[] = []
			rows.slice(1).forEach((cells, rowIndex) => {
				if (cells.every((value) => value === '' || value == null)) return

				const candidate: Record<string, unknown> = {}
				headers.forEach((header, columnIndex) => {
					if (!header) return
					const value = cells[columnIndex]

					if (header === 'health_insurance_date') {
						candidate[header] = formatExcelDate(value)
					} else if (onEmploymentNumericHeaders.has(header)) {
						candidate[header] =
							value === '' || value == null ? undefined : Number(value)
					} else {
						candidate[header] =
							value == null ? '' : value
					}
				})

				const parsed = onEmploymentSchema.safeParse(candidate)
				if (!parsed.success) {
					validationErrors.push(
						`Row ${rowIndex + 2}: ${parsed.error.issues
							.map((issue) =>
								`${issue.path.join('.') || 'row'}: ${issue.message}`,
							)
							.join(', ')}`,
					)
					return
				}

				validRows.push(calculateOnEmploymentRow(parsed.data))
				validRowNumbers.push(rowIndex + 2)
			})

			if (!validRows.length && !validationErrors.length) {
				throw new Error('Excel file has no non-empty data rows.')
			}

			setExcelRows(validRows)
			setExcelRowNumbers(validRowNumbers)
			setExcelErrors(validationErrors)
			if (validRows.length) {
				setSuccessMessage(`${validRows.length} row(s) ready for preview.`)
			}
		} catch (error) {
			setExcelRows([])
			setExcelRowNumbers([])
			setExcelErrors([
				error instanceof Error
					? error.message
					: 'Unable to read Excel file.',
			])
		}
	}

	const saveExcelRows = async () => {
		if (isSavingExcel || !excelRows.length || excelErrors.length) return

		setIsSavingExcel(true)
		setSuccessMessage('')
		setApiError('')
		const failedRows: OnEmploymentFormData[] = []
		const failedRowNumbers: number[] = []
		const failures: string[] = []
		const successfulRowNumbers: number[] = []
		let savedCount = 0

		try {
			for (const [index, row] of excelRows.entries()) {
				const sourceRowNumber = excelRowNumbers[index] ?? index + 2
				try {
					await submitOnEmploymentRow(row)
					savedCount += 1
					successfulRowNumbers.push(sourceRowNumber)
				} catch (error) {
					failedRows.push(row)
					failedRowNumbers.push(sourceRowNumber)
					failures.push(
						`Row ${sourceRowNumber}: ${
							error instanceof Error ? error.message : 'Save failed.'
						}`,
					)
				}
			}

			setExcelRows(failedRows)
			setExcelRowNumbers(failedRowNumbers)
			if (savedCount) {
				setSuccessMessage(
					`${savedCount} On Employment record(s) saved from Excel row(s): ${successfulRowNumbers.join(', ')}.`,
				)
			}
			setExcelErrors([])
			if (failures.length) setApiError(failures.join('\n'))
		} finally {
			setIsSavingExcel(false)
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
											placeholder="Enter employee reference ID"
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
													className={`form-control${fieldError(name) ? ' is-invalid' : ''}`}
													placeholder={
														name === 'account_no'
															? 'Enter bank account number'
															: name === 'ifsc'
																? 'Enter IFSC code'
																: `Enter ${label.toLowerCase()}`
													}
													{...register(
														name as any,
													)}
												/>
												{fieldError(name) && (
													<div className="invalid-feedback d-block">
														{fieldError(name)}
													</div>
												)}
											</div>
										),
									)}

									<div className="col-12 col-md-6 col-lg-4">
										<label className="form-label fw-semibold">
											Health insurance date
										</label>

										<input
											type="date"
											className={`form-control${fieldError('health_insurance_date') ? ' is-invalid' : ''}`}
											{...register(
												'health_insurance_date',
											)}
										/>
										{fieldError('health_insurance_date') && (
											<div className="invalid-feedback d-block">
												{fieldError('health_insurance_date')}
											</div>
										)}
									</div>

									<div className="col-12 col-md-6 col-lg-4">
										<label className="form-label fw-semibold">
											Work email
										</label>

										<input
											type="email"
											placeholder="Enter work email"
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
														placeholder={
															calculated
																? 'Calculated automatically'
																: `Enter ${label.toLowerCase()}`
														}
														step={
															integer
																? '1'
																: '0.01'
														}
														readOnly={
															calculated
														}
														className={`${calculated ? 'form-control bg-light' : 'form-control'}${fieldError(name as keyof OnEmploymentFormData) ? ' is-invalid' : ''}`}
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
													{fieldError(name as keyof OnEmploymentFormData) && (
														<div className="invalid-feedback d-block">
															{fieldError(name as keyof OnEmploymentFormData)}
														</div>
													)}
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
														placeholder={
															calculated
																? 'Calculated automatically'
																: `Enter ${label.toLowerCase()}`
														}
														step="0.01"
														readOnly={
															calculated
														}
														className={`${calculated ? 'form-control bg-light' : 'form-control'}${fieldError(name as keyof OnEmploymentFormData) ? ' is-invalid' : ''}`}
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
													{fieldError(name as keyof OnEmploymentFormData) && (
														<div className="invalid-feedback d-block">
															{fieldError(name as keyof OnEmploymentFormData)}
														</div>
													)}
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
														placeholder={
															calculated
																? 'Calculated automatically'
																: `Enter ${label.toLowerCase()}`
														}
														step="0.01"
														readOnly={
															calculated
														}
														className={`${calculated ? 'form-control bg-light' : 'form-control'}${fieldError(name as keyof OnEmploymentFormData) ? ' is-invalid' : ''}`}
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
													{fieldError(name as keyof OnEmploymentFormData) && (
														<div className="invalid-feedback d-block">
															{fieldError(name as keyof OnEmploymentFormData)}
														</div>
													)}
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

						<div className="border rounded bg-white p-3 p-md-4 mt-3">
							<h2 className="h5 mb-3">Upload Excel</h2>
							<input
								type="file"
								accept=".xlsx,.xls"
								className="form-control"
								disabled={isSavingExcel}
								onChange={(event) => {
									const file = event.target.files?.[0]
									event.target.value = ''
									void handleExcelSelect(file)
								}}
							/>

							{excelErrors.length > 0 && (
								<div className="alert alert-danger mt-3 mb-0">
									{excelErrors.map((error, index) => (
										<div key={`${index}-${error}`}>{error}</div>
									))}
								</div>
							)}

							{excelRows.length > 0 && (
								<>
									<h3 className="h6 mt-3">
										Excel Preview ({excelRows.length} rows)
									</h3>
									<div className="table-responsive">
										<table className="table table-bordered table-sm">
											<thead>
												<tr>
													<th>#</th>
													{onEmploymentExcelHeaders.map((header) => (
														<th key={header}>{header}</th>
													))}
												</tr>
											</thead>
											<tbody>
												{excelRows.map((row, index) => (
													<tr key={`${row.employee_refno_id}-${index}`}>
														<td>{excelRowNumbers[index]}</td>
														{onEmploymentExcelHeaders.map((header) => (
															<td key={header}>
																{String(row[header] ?? '')}
															</td>
														))}
													</tr>
												))}
											</tbody>
										</table>
									</div>
									<button
										type="button"
										className="btn btn-primary"
										disabled={isSavingExcel || excelErrors.length > 0}
										onClick={() => void saveExcelRows()}
									>
										{isSavingExcel ? 'Saving...' : 'Save'}
									</button>
								</>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default OnEmploymentForm