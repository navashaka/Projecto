import {
	Alert,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Grid,
	MenuItem,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import apiClient from '../../services/apiClient'
import { adminResourceMap } from './resourceConfig'
import type { AdminField, AdminRecord, AdminResource } from './types'

type FormValue = string | number | boolean | undefined
type FormValues = Record<string, FormValue>

const salaryCalculatedFields = new Set([
	'gross',
	'epf_deduction',
	'esi_insurance_deduction',
	'total_deductions',
	'net_salary',
	'epf_employer_share',
	'esi_employer_share',
	'total_ctc',
])

function defaultValues(resource: AdminResource): FormValues {
	return Object.fromEntries(
		resource.fields.map((field) => [
			field.name,
			field.kind === 'boolean' ? true : '',
		]),
	)
}

function inputValue(record: AdminRecord, field: AdminField): FormValue {
	const value = record[field.name]

	if (field.kind === 'date' && typeof value === 'string') {
		return value.slice(0, 10)
	}

	return value as FormValue
}

function displayValue(value: unknown) {
	if (value === null || value === undefined || value === '') {
		return '-'
	}

	if (typeof value === 'boolean') {
		return value ? 'Active' : 'Inactive'
	}

	return String(value)
}

function roundValue(value: number) {
	return Math.round(value)
}

function getNumber(values: FormValues, name: string) {
	const value = values[name]

	return typeof value === 'number' && !Number.isNaN(value)
		? value
		: 0
}

function calculateSalary(values: FormValues): FormValues {
	const basic = getNumber(values, 'basic')

	const allowances =
		getNumber(values, 'allowance1') +
		getNumber(values, 'allowance2') +
		getNumber(values, 'allowance3') +
		getNumber(values, 'allowance4') +
		getNumber(values, 'allowance5') +
		getNumber(values, 'allowance6') +
		getNumber(values, 'other_allowance')

	// Basic + allowances = Gross
	const gross = roundValue(basic + allowances)

	// Employee EPF = 12% of Basic
	const epfDeduction = roundValue(basic * 0.12)

	// Employee ESI = 0.75% of Gross when Gross <= 21000
	const esiDeduction =
		gross <= 21000 ? roundValue(gross * 0.0075) : 0

	const tds = getNumber(values, 'tds')
	const canteenDeduction = getNumber(values, 'canteen_deduction')
	const advanceDeduction = getNumber(values, 'advance_deduction')
	const loanEmi = getNumber(values, 'loan_emi')
	const otherDeduction = getNumber(values, 'other_deduction')

	// Total deductions
	const totalDeductions = roundValue(
		epfDeduction +
			esiDeduction +
			tds +
			canteenDeduction +
			advanceDeduction +
			loanEmi +
			otherDeduction,
	)

	// Gross - total deductions = Net salary
	const netSalary = roundValue(gross - totalDeductions)

	// Employer EPF = 3.67% of Basic
	const employerEpf = roundValue(basic * 0.0367)

	// Employer EPS = 8.33% of Basic
	// No separate EPS DB field exists, so include it directly in Total CTC.
	const employerEps = roundValue(basic * 0.0833)

	// Employer ESI = 3.25% of Gross when Gross <= 21000
	const employerEsi =
		gross <= 21000 ? roundValue(gross * 0.0325) : 0

	const insuranceEmployerShare = getNumber(
		values,
		'insurance_employer_share',
	)

	const transportAllowance = getNumber(
		values,
		'transport_allowance',
	)

	const canteenAllowance = getNumber(
		values,
		'canteen_allowance',
	)

	const bonus = getNumber(values, 'bonus')

	const otherEmployerContribution = getNumber(
		values,
		'other_employer_contribution',
	)

	// CTC = Gross + employer contributions + bonus + other contributions
	const totalCtc = roundValue(
		gross +
			employerEpf +
			employerEps +
			employerEsi +
			insuranceEmployerShare +
			transportAllowance +
			canteenAllowance +
			bonus +
			otherEmployerContribution,
	)

	return {
		gross,
		epf_deduction: epfDeduction,
		esi_insurance_deduction: esiDeduction,
		total_deductions: totalDeductions,
		net_salary: netSalary,
		epf_employer_share: employerEpf,
		esi_employer_share: employerEsi,
		total_ctc: totalCtc,
	}
}

function AdminResourcePage() {
	const { resourceKey } = useParams<{ resourceKey: string }>()
	const navigate = useNavigate()

	const resource = resourceKey
		? adminResourceMap[resourceKey]
		: undefined

	const [records, setRecords] = useState<AdminRecord[]>([])
	const [formValues, setFormValues] = useState<FormValues>({})
	const [editingRecord, setEditingRecord] =
		useState<AdminRecord | null>(null)

	const [dialogOpen, setDialogOpen] = useState(false)
	const [loading, setLoading] = useState(false)
	const [saving, setSaving] = useState(false)

	const [error, setError] = useState('')
	const [fieldError, setFieldError] = useState('')

	const loadRecords = useCallback(async () => {
		if (!resource) {
			return
		}

		setLoading(true)
		setError('')

		try {
			const response = await apiClient.get(resource.endpoint)

			setRecords(
				Array.isArray(response.data)
					? response.data
					: [],
			)
		} catch {
			setError(
				`Unable to load ${resource.label.toLowerCase()} records.`,
			)
		} finally {
			setLoading(false)
		}
	}, [resource])

	useEffect(() => {
		void loadRecords()
	}, [loadRecords])

	if (!resource) {
		return (
			<Paper sx={{ p: 4 }}>
				<Typography variant="h5">
					Admin resource not found
				</Typography>

				<Button
					onClick={() => navigate('/admin')}
					sx={{ mt: 2 }}
					variant="contained"
				>
					Back to admin
				</Button>
			</Paper>
		)
	}

	const isSalaryDetails = resource.key === 'salary-details'

	const openAdd = () => {
		setEditingRecord(null)
		setFormValues(defaultValues(resource))
		setFieldError('')
		setDialogOpen(true)
	}

	const openEdit = (record: AdminRecord) => {
		setEditingRecord(record)

		const values = Object.fromEntries(
			resource.fields.map((field) => [
				field.name,
				inputValue(record, field),
			]),
		)

		setFormValues(values)
		setFieldError('')
		setDialogOpen(true)
	}

	const closeDialog = () => {
		if (!saving) {
			setDialogOpen(false)
		}
	}

	const setValue = (
		field: AdminField,
		value: string,
	) => {
		if (
			isSalaryDetails &&
			salaryCalculatedFields.has(field.name)
		) {
			return
		}

		let parsedValue: FormValue

		if (field.kind === 'number') {
			parsedValue =
				value === '' ? undefined : Number(value)
		} else if (field.kind === 'boolean') {
			parsedValue = value === 'true'
		} else {
			parsedValue = value
		}

		setFormValues((current) => {
			const updatedValues = {
				...current,
				[field.name]: parsedValue,
			}

			if (isSalaryDetails) {
				return {
					...updatedValues,
					...calculateSalary(updatedValues),
				}
			}

			return updatedValues
		})
	}

	const saveRecord = async () => {
		let valuesToSave = formValues

		if (isSalaryDetails) {
			valuesToSave = {
				...formValues,
				...calculateSalary(formValues),
			}

			setFormValues(valuesToSave)
		}

		const missingField = resource.fields.find(
			(field) =>
				field.required &&
				(
					valuesToSave[field.name] === '' ||
					valuesToSave[field.name] === undefined
				),
		)

		if (missingField) {
			setFieldError(
				`${missingField.label} is required.`,
			)
			return
		}

		const invalidNumber = resource.fields.some(
			(field) =>
				field.kind === 'number' &&
				typeof valuesToSave[field.name] === 'number' &&
				Number.isNaN(valuesToSave[field.name] as number),
		)

		if (invalidNumber) {
			setFieldError(
				'Numeric fields must contain valid numbers.',
			)
			return
		}

		const payload = Object.fromEntries(
			resource.fields
				.filter(
					(field) =>
						valuesToSave[field.name] !== undefined &&
						valuesToSave[field.name] !== '',
				)
				.map((field) => [
					field.name,
					valuesToSave[field.name],
				]),
		)

		setSaving(true)
		setFieldError('')

		try {
			if (editingRecord?.id !== undefined) {
				await apiClient.put(
					`${resource.endpoint}${editingRecord.id}`,
					payload,
				)
			} else {
				await apiClient.post(
					resource.endpoint,
					payload,
				)
			}

			setDialogOpen(false)
			await loadRecords()
		} catch {
			setFieldError(
				`Unable to save this ${resource.label.toLowerCase()} record.`,
			)
		} finally {
			setSaving(false)
		}
	}

	const deleteRecord = async (
		record: AdminRecord,
	) => {
		if (
			record.id === undefined ||
			!window.confirm(
				`Delete this ${resource.label.toLowerCase()} record?`,
			)
		) {
			return
		}

		setError('')

		try {
			await apiClient.delete(
				`${resource.endpoint}${record.id}`,
			)

			await loadRecords()
		} catch {
			setError(
				`Unable to delete this ${resource.label.toLowerCase()} record.`,
			)
		}
	}

	return (
		<Stack spacing={3}>
			<Stack
				direction={{ xs: 'column', sm: 'row' }}
				spacing={2}
				sx={{
					justifyContent: 'space-between',
				}}
			>
				<div>
					<Typography variant="h4">
						{resource.label}
					</Typography>

					<Typography
						color="text.secondary"
						variant="body2"
					>
						Manage live backend records.
					</Typography>
				</div>

				<Stack direction="row" spacing={1}>
					<Button
						onClick={() => navigate('/admin')}
						variant="outlined"
					>
						All tables
					</Button>

					<Button
						onClick={openAdd}
						variant="contained"
					>
						Add record
					</Button>
				</Stack>
			</Stack>

			{error && (
				<Alert severity="error">
					{error}
				</Alert>
			)}

			<TableContainer
				component={Paper}
				sx={{
					maxHeight: 'calc(100vh - 220px)',
				}}
			>
				<Table
					stickyHeader
					size="small"
				>
					<TableHead>
						<TableRow>
							<TableCell>ID</TableCell>

							{resource.fields.map(
								(field) => (
									<TableCell
										key={field.name}
									>
										{field.label}
									</TableCell>
								),
							)}

							<TableCell align="right">
								Actions
							</TableCell>
						</TableRow>
					</TableHead>

					<TableBody>
						{loading && (
							<TableRow>
								<TableCell
									align="center"
									colSpan={
										resource.fields.length + 2
									}
								>
									Loading...
								</TableCell>
							</TableRow>
						)}

						{!loading &&
							records.map((record) => (
								<TableRow
									hover
									key={String(record.id)}
								>
									<TableCell>
										{displayValue(
											record.id,
										)}
									</TableCell>

									{resource.fields.map(
										(field) => (
											<TableCell
												key={
													field.name
												}
											>
												{displayValue(
													record[
														field.name
													],
												)}
											</TableCell>
										),
									)}

									<TableCell
										align="right"
										sx={{
											whiteSpace:
												'nowrap',
										}}
									>
										<Button
											onClick={() =>
												openEdit(
													record,
												)
											}
											size="small"
										>
											Edit
										</Button>

										<Button
											color="error"
											onClick={() =>
												void deleteRecord(
													record,
												)
											}
											size="small"
										>
											Delete
										</Button>
									</TableCell>
								</TableRow>
							))}

						{!loading &&
							records.length === 0 && (
								<TableRow>
									<TableCell
										align="center"
										colSpan={
											resource.fields.length +
											2
										}
									>
										No records found.
									</TableCell>
								</TableRow>
							)}
					</TableBody>
				</Table>
			</TableContainer>

			<Dialog
				fullWidth
				maxWidth="md"
				onClose={closeDialog}
				open={dialogOpen}
			>
				<DialogTitle>
					{editingRecord
						? `Edit ${resource.label}`
						: `Add ${resource.label}`}
				</DialogTitle>

				<DialogContent dividers>
					{fieldError && (
						<Alert
							severity="error"
							sx={{ mb: 2 }}
						>
							{fieldError}
						</Alert>
					)}

					<Grid
						container
						spacing={2}
						sx={{ pt: 1 }}
					>
						{resource.fields.map(
							(field) => {
								const isCalculated =
									isSalaryDetails &&
									salaryCalculatedFields.has(
										field.name,
									)

								return (
									<Grid
										key={field.name}
										size={{
											xs: 12,
											sm: field.multiline
												? 12
												: 6,
										}}
									>
										<TextField
											fullWidth
											label={
												field.label
											}
											multiline={
												field.multiline
											}
											onChange={(
												event,
											) =>
												setValue(
													field,
													event
														.target
														.value,
												)
											}
											required={
												field.required
											}
											select={
												field.kind ===
												'boolean'
											}
											type={
												field.kind ===
												'date'
													? 'date'
													: field.kind ===
														  'number'
														? 'number'
														: 'text'
											}
											value={
												formValues[
													field.name
												] ?? ''
											}
											variant="outlined"
											disabled={
												isCalculated
											}
										>
											{field.kind ===
												'boolean' && (
												<>
													<MenuItem value="true">
														Active
													</MenuItem>

													<MenuItem value="false">
														Inactive
													</MenuItem>
												</>
											)}
										</TextField>
									</Grid>
								)
							},
						)}
					</Grid>
				</DialogContent>

				<DialogActions>
					<Button
						disabled={saving}
						onClick={closeDialog}
					>
						Cancel
					</Button>

					<Button
						disabled={saving}
						onClick={() =>
							void saveRecord()
						}
						variant="contained"
					>
						{saving ? 'Saving...' : 'Save'}
					</Button>
				</DialogActions>
			</Dialog>
		</Stack>
	)
}

export default AdminResourcePage 