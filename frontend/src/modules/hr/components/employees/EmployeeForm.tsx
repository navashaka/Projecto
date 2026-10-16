import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import * as XLSX from 'xlsx'
import apiClient from '../../../../services/apiClient'
import HRBackButton from '../HRBackButton'

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

const employeeEnquirySchema = z.object({
	candidate_name: z
		.string()
		.trim()
		.min(1, 'Candidate name is required')
		.max(200, 'Candidate name must be 200 characters or less'),
	father_name: optionalText(200, 'Father name'),
	date_of_birth: optionalDate,
	blood_group: optionalText(20, 'Blood group'),
	marital_status: optionalText(50, 'Marital status'),
	address: optionalLongText,
	phone: optionalText(30, 'Phone'),
	pan: optionalText(30, 'PAN'),
	aadhaar: optionalText(30, 'Aadhaar'),
	passport_no: optionalText(60, 'Passport number'),
	personal_email: z
		.string()
		.trim()
		.max(150, 'Personal email must be 150 characters or less')
		.email('Enter a valid email address')
		.optional()
		.or(z.literal('')),
	emergency_phone_1: optionalText(30, 'Emergency phone 1'),
	emergency_phone_2: optionalText(30, 'Emergency phone 2'),
	mother_tongue: optionalText(50, 'Mother tongue'),
	other_languages_known: optionalText(200, 'Other languages known'),
	religion: optionalText(80, 'Religion'),
	nationality: optionalText(80, 'Nationality'),
	highest_qualification: optionalText(200, 'Highest qualification'),
	year_of_pass: optionalText(20, 'Year of pass'),
	highest_qualification_document: optionalText(255, 'Highest qualification document'),
	year_of_pass_document: optionalText(255, 'Year of pass document'),
	current_employer: optionalText(200, 'Current employer'),
	current_position: optionalText(200, 'Current position'),
	department: optionalText(200, 'Department'),
	working_period: optionalText(150, 'Working period'),
	role_responsibilities: optionalLongText,
	current_ctc: optionalText(50, 'Current CTC'),
	employer_documents: optionalText(255, 'Employer documents'),
	previous_employer_name: optionalText(200, 'Previous employer name'),
	previous_employer_position: optionalText(200, 'Previous employer position'),
	previous_employer_department: optionalText(200, 'Previous employer department'),
	previous_employer_working_period: optionalText(150, 'Previous employer working period'),
	previous_employer_role: optionalLongText,
	previous_employer_ctc: optionalText(50, 'Previous employer CTC'),
	previous_employer_documents: optionalText(255, 'Previous employer documents'),
	is_active: z.boolean().optional(),
})

type EmployeeEnquiryFormData = z.infer<typeof employeeEnquirySchema>
const excelHeaders = Object.keys(
	employeeEnquirySchema.shape,
) as (keyof EmployeeEnquiryFormData)[]

type EmployeeEnquiryPayload = {
	[K in keyof EmployeeEnquiryFormData]: EmployeeEnquiryFormData[K] | null
}

type TextFieldConfig = {
	name: keyof EmployeeEnquiryFormData
	label: string
	maxLength: number
}

type DocumentFieldConfig = TextFieldConfig & {
	multiple?: boolean
}

const textFields: TextFieldConfig[] = [
	{ name: 'father_name', label: 'Father name', maxLength: 200 },
	{ name: 'blood_group', label: 'Blood group', maxLength: 20 },
	{ name: 'marital_status', label: 'Marital status', maxLength: 50 },
	{ name: 'phone', label: 'Phone', maxLength: 30 },
	{ name: 'pan', label: 'PAN', maxLength: 30 },
	{ name: 'aadhaar', label: 'Aadhaar', maxLength: 30 },
	{ name: 'passport_no', label: 'Passport number', maxLength: 60 },
	{ name: 'emergency_phone_1', label: 'Emergency phone 1', maxLength: 30 },
	{ name: 'emergency_phone_2', label: 'Emergency phone 2', maxLength: 30 },
	{ name: 'mother_tongue', label: 'Mother tongue', maxLength: 50 },
	{ name: 'other_languages_known', label: 'Other languages known', maxLength: 200 },
	{ name: 'religion', label: 'Religion', maxLength: 80 },
	{ name: 'nationality', label: 'Nationality', maxLength: 80 },
	{ name: 'highest_qualification', label: 'Highest qualification', maxLength: 200 },
	{ name: 'year_of_pass', label: 'Year of pass', maxLength: 20 },
	{ name: 'current_employer', label: 'Current employer', maxLength: 200 },
	{ name: 'current_position', label: 'Current position', maxLength: 200 },
	{ name: 'department', label: 'Department', maxLength: 200 },
	{ name: 'working_period', label: 'Working period', maxLength: 150 },
	{ name: 'current_ctc', label: 'Current CTC', maxLength: 50 },
	{ name: 'previous_employer_name', label: 'Previous employer name', maxLength: 200 },
	{ name: 'previous_employer_position', label: 'Previous employer position', maxLength: 200 },
	{ name: 'previous_employer_department', label: 'Previous employer department', maxLength: 200 },
	{
		name: 'previous_employer_working_period',
		label: 'Previous employer working period',
		maxLength: 150,
	},
	{ name: 'previous_employer_ctc', label: 'Previous employer CTC', maxLength: 50 },
] as const

const documentFields: DocumentFieldConfig[] = [
	{
		name: 'highest_qualification_document',
		label: 'Highest qualification document',
		maxLength: 255,
	},
	{ name: 'year_of_pass_document', label: 'Year of pass document', maxLength: 255 },
	{ name: 'employer_documents', label: 'Employer documents', maxLength: 255, multiple: true },
	{
		name: 'previous_employer_documents',
		label: 'Previous employer documents',
		maxLength: 255,
	},
] as const

function fileName(value: unknown) {
	if (typeof FileList !== 'undefined' && value instanceof FileList) {
		return value.item(0)?.name ?? ''
	}

	return typeof value === 'string' ? value : ''
}

function normalizeExcelHeader(value: unknown): string {
	const header = String(value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_')
	const aliases: Record<string, keyof EmployeeEnquiryFormData> = {
		position: 'current_position',
		previous_employer: 'previous_employer_name',
		previous_position: 'previous_employer_position',
		previous_department: 'previous_employer_department',
		previous_working_period: 'previous_employer_working_period',
		previous_ctc: 'previous_employer_ctc',
		responsibilities: 'previous_employer_role',
	}
	return aliases[header] ?? header
}

function formatExcelDate(value: unknown): string {
	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		return value.toISOString().slice(0, 10)
	}
	if (typeof value === 'number') {
		const date = XLSX.SSF.parse_date_code(value)
		if (date) {
			return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`
		}
	}
	return String(value ?? '').trim()
}

function toPayload(data: EmployeeEnquiryFormData): EmployeeEnquiryPayload {
	return {
		candidate_name: data.candidate_name,
		father_name: data.father_name || null,
		date_of_birth: data.date_of_birth || null,
		blood_group: data.blood_group || null,
		marital_status: data.marital_status || null,
		address: data.address || null,
		phone: data.phone || null,
		pan: data.pan || null,
		aadhaar: data.aadhaar || null,
		passport_no: data.passport_no || null,
		personal_email: data.personal_email || null,
		emergency_phone_1: data.emergency_phone_1 || null,
		emergency_phone_2: data.emergency_phone_2 || null,
		mother_tongue: data.mother_tongue || null,
		other_languages_known: data.other_languages_known || null,
		religion: data.religion || null,
		nationality: data.nationality || null,
		highest_qualification: data.highest_qualification || null,
		year_of_pass: data.year_of_pass || null,
		highest_qualification_document:
			data.highest_qualification_document || null,
		year_of_pass_document: data.year_of_pass_document || null,
		current_employer: data.current_employer || null,
		current_position: data.current_position || null,
		department: data.department || null,
		working_period: data.working_period || null,
		role_responsibilities: data.role_responsibilities || null,
		current_ctc: data.current_ctc || null,
		employer_documents: data.employer_documents || null,
		previous_employer_name: data.previous_employer_name || null,
		previous_employer_position: data.previous_employer_position || null,
		previous_employer_department: data.previous_employer_department || null,
		previous_employer_working_period:
			data.previous_employer_working_period || null,
		previous_employer_role: data.previous_employer_role || null,
		previous_employer_ctc: data.previous_employer_ctc || null,
		previous_employer_documents: data.previous_employer_documents || null,
		is_active: data.is_active ?? true,
	}
}

function EmployeeForm() {
	const [excelRows, setExcelRows] = useState<EmployeeEnquiryFormData[]>([])
	const [excelErrors, setExcelErrors] = useState<string[]>([])
	const [message, setMessage] = useState('')
	const [messageType, setMessageType] = useState<'success' | 'error'>('success')
	const [saving, setSaving] = useState(false)

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<EmployeeEnquiryFormData>({
		resolver: zodResolver(employeeEnquirySchema),
		mode: 'onChange',
		defaultValues: {
			candidate_name: '',
			father_name: '',
			date_of_birth: '',
			blood_group: '',
			marital_status: '',
			address: '',
			phone: '',
			pan: '',
			aadhaar: '',
			passport_no: '',
			personal_email: '',
			emergency_phone_1: '',
			emergency_phone_2: '',
			mother_tongue: '',
			other_languages_known: '',
			religion: '',
			nationality: '',
			highest_qualification: '',
			year_of_pass: '',
			highest_qualification_document: '',
			year_of_pass_document: '',
			current_employer: '',
			current_position: '',
			department: '',
			working_period: '',
			role_responsibilities: '',
			current_ctc: '',
			employer_documents: '',
			previous_employer_name: '',
			previous_employer_position: '',
			previous_employer_department: '',
			previous_employer_working_period: '',
			previous_employer_role: '',
			previous_employer_ctc: '',
			previous_employer_documents: '',
			is_active: true,
		},
	})

	const onSubmit = async (data: EmployeeEnquiryFormData) => {
		if (saving) return
		setSaving(true)
		setMessage('')
		try {
			await apiClient.post('/api/v1/user-enquiries/', toPayload(data))
			setMessageType('success')
			setMessage('Employee enquiry submitted successfully.')
		} catch (error) {
			const detail = (
				error as { response?: { data?: { detail?: string } } }
			).response?.data?.detail
			setMessageType('error')
			setMessage(detail ?? 'Unable to submit employee enquiry.')
		} finally {
			setSaving(false)
		}
	}

	const handleExcelSelect = async (file?: File) => {
		setExcelRows([])
		setExcelErrors([])
		setMessage('')
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

			const requiredHeaders = ['candidate_name']
			const missingHeaders = requiredHeaders.filter(
				(header) => !headers.includes(header),
			)
			const unsupportedHeaders = headers.filter(
				(header) =>
					header &&
					!excelHeaders.some((supported) => supported === header),
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

			const validRows: EmployeeEnquiryFormData[] = []
			const validationErrors: string[] = []
			rows.slice(1).forEach((cells, rowIndex) => {
				if (cells.every((value) => value === '' || value == null)) return

				const candidate: Record<string, unknown> = {
					...Object.fromEntries(
						excelHeaders.map((header) => [
							header,
							header === 'is_active' ? true : '',
						]),
					),
				}
				headers.forEach((header, columnIndex) => {
					if (!header) return
					const value = cells[columnIndex]
					if (header === 'date_of_birth') {
						candidate[header] = formatExcelDate(value)
					} else if (header === 'is_active') {
						if (value === true || value === false) {
							candidate[header] = value
						} else {
							const normalized = String(value).trim().toLowerCase()
							candidate[header] =
								normalized === 'true' || normalized === '1' ||
								normalized === 'active'
						}
					} else {
						candidate[header] = value == null ? '' : String(value).trim()
					}
				})

				const parsed = employeeEnquirySchema.safeParse(candidate)
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
		} catch (error) {
			setExcelRows([])
			setExcelErrors([
				error instanceof Error ? error.message : 'Unable to read Excel file.',
			])
		}
	}

	const saveExcelRows = async () => {
		if (saving || !excelRows.length || excelErrors.length) return
		setSaving(true)
		setMessage('')
		const failedRows: EmployeeEnquiryFormData[] = []
		const failures: string[] = []
		let savedCount = 0
		try {
			for (const [index, row] of excelRows.entries()) {
				try {
					await apiClient.post('/api/v1/user-enquiries/', toPayload(row))
					savedCount += 1
				} catch (error) {
					failedRows.push(row)
					const detail = (
						error as { response?: { data?: { detail?: string } } }
					).response?.data?.detail
					failures.push(`Row ${index + 2}: ${detail ?? 'Save failed.'}`)
				}
			}
			setExcelRows(failedRows)
			setMessageType(failures.length ? 'error' : 'success')
			setMessage(
				failures.length
					? `${savedCount} saved. ${failures.join('; ')}`
					: `${savedCount} employee enquiries saved successfully.`,
			)
		} finally {
			setSaving(false)
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
					<Typography variant="h5">Employee Enquiry</Typography>
				</div>

				{message && (
					<div className={`alert alert-${messageType === 'success' ? 'success' : 'danger'}`}>
						{message}
					</div>
				)}

				<Stack spacing={2}>
					<Typography variant="h6">Personal information</Typography>

					<Grid container spacing={2}>
						<Grid size={{ xs: 12, md: 6 }}>
							<TextField
								{...register('candidate_name')}
								error={!!errors.candidate_name}
								helperText={errors.candidate_name?.message}
								label="Candidate name"
								required
								fullWidth
							/>
						</Grid>

						<Grid size={{ xs: 12, md: 4 }}>
							<TextField
								{...register('date_of_birth')}
								error={!!errors.date_of_birth}
								helperText={errors.date_of_birth?.message}
								label="Date of birth"
								type="date"
								slotProps={{ inputLabel: { shrink: true } }}
								fullWidth
							/>
						</Grid>

						{textFields.slice(0, 3).map(({ name, label, maxLength }) => (
							<Grid key={name} size={{ xs: 12, md: 4 }}>
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

						<Grid size={{ xs: 12 }}>
							<TextField
								{...register('address')}
								error={!!errors.address}
								helperText={errors.address?.message}
								label="Address"
								multiline
								minRows={2}
								fullWidth
							/>
						</Grid>
					</Grid>
				</Stack>

				<Stack spacing={2}>
					<Typography variant="h6">Contact and identity</Typography>
					<Grid container spacing={2}>
						<Grid size={{ xs: 12, md: 6 }}>
							<TextField
								{...register('personal_email')}
								error={!!errors.personal_email}
								helperText={errors.personal_email?.message}
								label="Personal email"
								type="email"
								fullWidth
							/>
						</Grid>

						{textFields.slice(3, 13).map(({ name, label, maxLength }) => (
							<Grid key={name} size={{ xs: 12, md: 4 }}>
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
					</Grid>
				</Stack>

				<Stack spacing={2}>
					<Typography variant="h6">Qualification and employment</Typography>
					<Grid container spacing={2}>
						{textFields.slice(13, 20).map(({ name, label, maxLength }) => (
							<Grid key={name} size={{ xs: 12, md: 6 }}>
								<TextField
									{...register(name)}
									error={!!errors[name]}
									helperText={errors[name]?.message}
									label={label}
									type={name === 'year_of_pass' ? 'text' : 'text'}
									slotProps={{ htmlInput: { maxLength } }}
									fullWidth
								/>
							</Grid>
						))}

						<Grid size={{ xs: 12 }}>
							<TextField
								{...register('role_responsibilities')}
								error={!!errors.role_responsibilities}
								helperText={errors.role_responsibilities?.message}
								label="Role responsibilities"
								multiline
								minRows={4}
								fullWidth
							/>
						</Grid>

						{documentFields.slice(0, 2).map(({ name, label, maxLength }) => (
							<Grid key={name} size={{ xs: 12, md: 6 }}>
								<TextField
									{...register(name, { setValueAs: fileName })}
									error={!!errors[name]}
									helperText={errors[name]?.message}
									label={label}
									type="file"
									slotProps={{
										htmlInput: { accept: '.pdf,.jpg,.jpeg,.png', maxLength },
										inputLabel: { shrink: true },
									}}
									fullWidth
								/>
							</Grid>
						))}
					</Grid>
				</Stack>

				<Stack spacing={2}>
					<Typography variant="h6">Previous employment</Typography>
					<Grid container spacing={2}>
						{textFields.slice(20).map(({ name, label, maxLength }) => (
							<Grid key={name} size={{ xs: 12, md: 6 }}>
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

						<Grid size={{ xs: 12 }}>
							<TextField
								{...register('previous_employer_role')}
								error={!!errors.previous_employer_role}
								helperText={errors.previous_employer_role?.message}
								label="Previous employer role"
								multiline
								minRows={3}
								fullWidth
							/>
						</Grid>

						<Grid size={{ xs: 12, md: 6 }}>
							<TextField
								{...register('employer_documents', { setValueAs: fileName })}
								error={!!errors.employer_documents}
								helperText={errors.employer_documents?.message}
								label="Employer documents"
								type="file"
								slotProps={{
									htmlInput: { accept: '.pdf,.jpg,.jpeg,.png', multiple: true },
									inputLabel: { shrink: true },
								}}
								fullWidth
							/>
						</Grid>

						<Grid size={{ xs: 12, md: 6 }}>
							<TextField
								{...register('previous_employer_documents', { setValueAs: fileName })}
								error={!!errors.previous_employer_documents}
								helperText={errors.previous_employer_documents?.message}
								label="Previous employer documents"
								type="file"
								slotProps={{
									htmlInput: { accept: '.pdf,.jpg,.jpeg,.png' },
									inputLabel: { shrink: true },
								}}
								fullWidth
							/>
						</Grid>
					</Grid>
				</Stack>

				<Grid container spacing={2}>
					<Grid size={{ xs: 12, md: 6 }}>
						<TextField
							{...register('is_active', {
								setValueAs: (value) => value === 'true',
							})}
							error={!!errors.is_active}
							helperText={errors.is_active?.message}
							label="Active"
							select
							fullWidth
						>
							<MenuItem value="true">Active</MenuItem>
							<MenuItem value="false">Inactive</MenuItem>
						</TextField>
					</Grid>
				</Grid>

				<div className="d-flex justify-content-end gap-2">
					<Button
						type="submit"
						variant="contained"
						disabled={saving}
					>
						{saving ? 'Submitting...' : 'Submit enquiry'}
					</Button>
					<HRBackButton />
				</div>

				<Stack spacing={2}>
					<Typography variant="h6">Upload Excel</Typography>
					<input
						type="file"
						accept=".xlsx,.xls"
						className="form-control"
						disabled={saving}
						onChange={(event) => {
							const file = event.target.files?.[0]
							event.target.value = ''
							void handleExcelSelect(file)
						}}
					/>
					{excelErrors.length > 0 && (
						<div className="alert alert-danger mb-0">
							{excelErrors.map((error, index) => (
								<div key={`${index}-${error}`}>{error}</div>
							))}
						</div>
					)}
					{excelRows.length > 0 && (
						<>
							<Typography variant="subtitle1">
								Excel Preview ({excelRows.length} rows)
							</Typography>
							<div className="table-responsive">
								<table className="table table-bordered table-sm">
									<thead>
										<tr>
											<th>#</th>
											{excelHeaders.map((header) => (
												<th key={header}>{header}</th>
											))}
										</tr>
									</thead>
									<tbody>
										{excelRows.map((row, index) => (
											<tr key={`${row.candidate_name}-${index}`}>
												<td>{index + 1}</td>
												{excelHeaders.map((header) => (
													<td key={header}>
														{String(row[header] ?? '')}
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
								disabled={saving || excelErrors.length > 0}
								onClick={() => void saveExcelRows()}
							>
								{saving ? 'Saving...' : 'Save'}
							</Button>
						</>
					)}
				</Stack>
			</Stack>
		</Paper>
	)
}

export default EmployeeForm
