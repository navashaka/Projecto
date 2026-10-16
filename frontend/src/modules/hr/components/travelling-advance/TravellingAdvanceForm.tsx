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
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as XLSX from 'xlsx'
import HRBackButton from '../HRBackButton'

const optionalText = (maxLength: number, label: string) =>
	z.string().trim().max(maxLength, `${label} must be ${maxLength} characters or less`).optional()

const optionalDate = z.string().refine((value) => {
	if (!value) return true
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
	const [year, month, day] = value.split('-').map(Number)
	const date = new Date(year, month - 1, day)
	return date.getFullYear() === year &&
		date.getMonth() === month - 1 &&
		date.getDate() === day
}, 'Enter a valid date').optional()

const optionalAmount = (label: string) =>
	z.number()
		.finite(`${label} must be a valid number`)
		.refine((value) => Math.abs(value) <= 9999999999.99, `${label} must fit Numeric(12, 2)`)
		.refine(
			(value) =>
				Math.abs(value * 100 - Math.round(value * 100)) <=
				Number.EPSILON * Math.max(1, Math.abs(value * 100)),
			`${label} must have at most 2 decimal places`,
		)
		.optional()

const travellingAdvanceSchema = z.object({
	user_id: z.number().int('User ID must be a whole number').positive('User ID must be positive'),
	employee_code: optionalText(50, 'Employee code'),
	designation: optionalText(150, 'Designation'),
	department: optionalText(150, 'Department'),
	from_date: optionalDate,
	to_date: optionalDate,
	place_visited: optionalText(200, 'Place visited'),
	purpose_of_visit: z.string().optional(),
	type_of_expense: optionalText(100, 'Type of expense'),
	expense_amount: optionalAmount('Expense amount'),
	additional_expense_type: optionalText(100, 'Additional expense type'),
	additional_expense_amount: optionalAmount('Additional expense amount'),
	other_expense_type: optionalText(100, 'Other expense type'),
	other_expense_amount: optionalAmount('Other expense amount'),
	total_advance: optionalAmount('Total advance'),
})

type TravellingAdvanceFormData = z.infer<typeof travellingAdvanceSchema>

const travellingAdvanceExcelHeaders = Object.keys(
	travellingAdvanceSchema.shape,
) as (keyof TravellingAdvanceFormData)[]
const travellingAdvanceNumericHeaders = new Set<string>([
	'user_id',
	'expense_amount',
	'additional_expense_amount',
	'other_expense_amount',
	'total_advance',
])

function normalizeExcelHeader(value: unknown) {
	return String(value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_')
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
	const [excelRows, setExcelRows] = useState<Record<string, unknown>[]>([])
	const [excelErrors, setExcelErrors] = useState<string[]>([])
	const [savingExcel, setSavingExcel] = useState(false)

	const {
		register,
		control,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<TravellingAdvanceFormData>({
		resolver: zodResolver(travellingAdvanceSchema),
		mode: 'onChange',
		defaultValues: {
			user_id: undefined as unknown as number,
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

	const validationProps = (name: keyof TravellingAdvanceFormData) => {
		const message = errors[name]?.message
		return {
			error: Boolean(message),
			helperText: typeof message === 'string' ? message : undefined,
		}
	}

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

	const handleExcelSelect = async (file?: File) => {
		setExcelRows([])
		setExcelErrors([])
		setSuccessMessage('')
		setErrorMessage('')
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
			if (rows.length < 2) throw new Error('Excel file has no data rows.')

			const headers = rows[0].map(normalizeExcelHeader)
			const duplicateHeaders = headers.filter(
				(header, index) => header && headers.indexOf(header) !== index,
			)
			if (duplicateHeaders.length) {
				throw new Error(
					`Duplicate Excel columns: ${[...new Set(duplicateHeaders)].join(', ')}.`,
				)
			}
			const allowedHeaders = new Set<string>(travellingAdvanceExcelHeaders)
			const missingHeaders = ['user_id'].filter(
				(header) => !headers.includes(header),
			)
			const unsupportedHeaders = headers.filter(
				(header) => header && !allowedHeaders.has(header),
			)
			if (missingHeaders.length || unsupportedHeaders.length) {
				throw new Error([
					...(missingHeaders.length
						? [`Missing required columns: ${missingHeaders.join(', ')}`]
						: []),
					...(unsupportedHeaders.length
						? [`Unsupported columns: ${unsupportedHeaders.join(', ')}`]
						: []),
				].join('. '))
			}

			const validRows: Record<string, unknown>[] = []
			const validationErrors: string[] = []
			rows.slice(1).forEach((cells, rowIndex) => {
				if (cells.every((value) => value === '' || value == null)) return
				const candidate: Record<string, unknown> = Object.fromEntries(
					travellingAdvanceExcelHeaders.map((header) => [
						header,
						travellingAdvanceNumericHeaders.has(header) ||
						header === 'from_date' ||
						header === 'to_date'
							? undefined
							: '',
					]),
				)
				headers.forEach((header, columnIndex) => {
					if (!header) return
					const value = cells[columnIndex]
					if (header === 'from_date' || header === 'to_date') {
						candidate[header] = formatExcelDate(value)
					} else if (travellingAdvanceNumericHeaders.has(header)) {
						candidate[header] =
							value === '' || value == null ? undefined : Number(value)
					} else {
						candidate[header] =
							value == null ? '' : value
					}
				})

				const parsed = travellingAdvanceSchema.safeParse(candidate)
				if (!parsed.success) {
					validationErrors.push(
						`Row ${rowIndex + 2}: ${parsed.error.issues
							.map((issue) => `${issue.path.join('.') || 'row'}: ${issue.message}`)
							.join(', ')}`,
					)
					return
				}
				validRows.push(parsed.data)
			})

			if (!validRows.length && !validationErrors.length) {
				throw new Error('Excel file has no non-empty data rows.')
			}
			setExcelRows(validRows)
			setExcelErrors(validationErrors)
			if (validRows.length) {
				setSuccessMessage(`${validRows.length} row(s) ready for preview.`)
			}
		} catch (error) {
			setExcelRows([])
			setExcelErrors([
				error instanceof Error ? error.message : 'Unable to read Excel file.',
			])
		}
	}

	const saveExcelRows = async () => {
		if (savingExcel || !excelRows.length || excelErrors.length) return
		setSavingExcel(true)
		setSuccessMessage('')
		setErrorMessage('')
		const failedRows: Record<string, unknown>[] = []
		const failures: string[] = []
		let savedCount = 0

		try {
			for (const [index, row] of excelRows.entries()) {
				try {
					const total = roundValue(
						getNumber(row.expense_amount) +
							getNumber(row.additional_expense_amount) +
							getNumber(row.other_expense_amount),
					)
					const response = await fetch(
						'http://127.0.0.1:8000/travelling-advance/',
						{
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ ...row, total_advance: total }),
						},
					)
					const result = await response.json().catch(() => null)
					if (!response.ok) {
						throw new Error(
							result?.detail
								? JSON.stringify(result.detail)
								: 'Failed to submit travelling advance.',
						)
					}
					savedCount += 1
				} catch (error) {
					failedRows.push(row)
					failures.push(
						`Row ${index + 2}: ${error instanceof Error ? error.message : 'Save failed.'}`,
					)
				}
			}
			setExcelRows(failedRows)
			if (savedCount) {
				setSuccessMessage(`${savedCount} travelling advance record(s) saved.`)
			}
			setExcelErrors([])
			if (failures.length) setErrorMessage(failures.join('\n'))
		} finally {
			setSavingExcel(false)
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
							{...validationProps('user_id')}
							label="User ID"
							type="number"
							required
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('employee_code')}
							{...validationProps('employee_code')}
							label="Employee code"
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('designation')}
							{...validationProps('designation')}
							label="Designation"
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('department')}
							{...validationProps('department')}
							label="Department"
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('from_date')}
							{...validationProps('from_date')}
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
							{...validationProps('to_date')}
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
							{...validationProps('place_visited')}
							label="Place visited"
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('type_of_expense')}
							{...validationProps('type_of_expense')}
							label="Type of expense"
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12 }}>
						<TextField
							{...register('purpose_of_visit')}
							{...validationProps('purpose_of_visit')}
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
							{...validationProps('expense_amount')}
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
							{...validationProps('additional_expense_type')}
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
							{...validationProps('additional_expense_amount')}
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
							{...validationProps('other_expense_type')}
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
							{...validationProps('other_expense_amount')}
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

				<section className="border rounded bg-white p-3 p-md-4">
					<Typography variant="h6" sx={{ mb: 1.5 }}>
						Upload Excel
					</Typography>
					<input
						type="file"
						accept=".xlsx,.xls"
						className="form-control"
						disabled={savingExcel}
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
							<Typography variant="subtitle1" sx={{ mt: 2 }}>
								Excel Preview ({excelRows.length} rows)
							</Typography>
							<div className="table-responsive">
								<table className="table table-bordered table-sm">
									<thead>
										<tr>
											<th>#</th>
											{travellingAdvanceExcelHeaders.map((header) => (
												<th key={header}>{header}</th>
											))}
										</tr>
									</thead>
									<tbody>
										{excelRows.map((row, index) => (
											<tr key={`${row.user_id}-${index}`}>
												<td>{index + 1}</td>
												{travellingAdvanceExcelHeaders.map((header) => (
													<td key={header}>
														{String(
															header === 'total_advance'
																? roundValue(
																		getNumber(row.expense_amount) +
																			getNumber(row.additional_expense_amount) +
																			getNumber(row.other_expense_amount),
																	)
																: row[header] ?? '',
														)}
													</td>
												))}
											</tr>
										))}
									</tbody>
								</table>
							</div>
							<Button
								type="button"
								variant="contained"
								disabled={savingExcel || excelErrors.length > 0}
								onClick={() => void saveExcelRows()}
							>
								{savingExcel ? 'Saving...' : 'Save'}
							</Button>
						</>
					)}
				</section>
			</Stack>
		</Paper>
	)
}

export default TravellingAdvanceForm