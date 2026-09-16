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

function defaultValues(resource: AdminResource): FormValues {
	return Object.fromEntries(
		resource.fields.map((field) => [field.name, field.kind === 'boolean' ? true : '']),
	)
}

function inputValue(record: AdminRecord, field: AdminField): FormValue {
	const value = record[field.name]
	if (field.kind === 'date' && typeof value === 'string') return value.slice(0, 10)
	return value as FormValue
}

function displayValue(value: unknown) {
	if (value === null || value === undefined || value === '') return '-'
	if (typeof value === 'boolean') return value ? 'Active' : 'Inactive'
	return String(value)
}

function AdminResourcePage() {
	const { resourceKey } = useParams<{ resourceKey: string }>()
	const navigate = useNavigate()
	const resource = resourceKey ? adminResourceMap[resourceKey] : undefined
	const [records, setRecords] = useState<AdminRecord[]>([])
	const [formValues, setFormValues] = useState<FormValues>({})
	const [editingRecord, setEditingRecord] = useState<AdminRecord | null>(null)
	const [dialogOpen, setDialogOpen] = useState(false)
	const [loading, setLoading] = useState(false)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState('')
	const [fieldError, setFieldError] = useState('')

	const loadRecords = useCallback(async () => {
		if (!resource) return
		setLoading(true)
		setError('')
		try {
			const response = await apiClient.get(resource.endpoint)
			setRecords(Array.isArray(response.data) ? response.data : [])
		} catch {
			setError(`Unable to load ${resource.label.toLowerCase()} records.`)
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
				<Typography variant="h5">Admin resource not found</Typography>
				<Button onClick={() => navigate('/admin')} sx={{ mt: 2 }} variant="contained">
					Back to admin
				</Button>
			</Paper>
		)
	}

	const openAdd = () => {
		setEditingRecord(null)
		setFormValues(defaultValues(resource))
		setFieldError('')
		setDialogOpen(true)
	}

	const openEdit = (record: AdminRecord) => {
		setEditingRecord(record)
		setFormValues(
			Object.fromEntries(resource.fields.map((field) => [field.name, inputValue(record, field)])),
		)
		setFieldError('')
		setDialogOpen(true)
	}

	const closeDialog = () => {
		if (!saving) setDialogOpen(false)
	}

	const setValue = (field: AdminField, value: unknown) => {
		const parsedValue =
			field.kind === 'number'
				? value === ''
					? undefined
					: Number(value)
				: field.kind === 'boolean'
					? value === true || value === 'true'
					: String(value)
		setFormValues((current) => ({ ...current, [field.name]: parsedValue }))
	}

	const saveRecord = async () => {
		const missingField = resource.fields.find(
			(field) => field.required && (formValues[field.name] === '' || formValues[field.name] === undefined),
		)
		if (missingField) {
			setFieldError(`${missingField.label} is required.`)
			return
		}

		if (resource.fields.some((field) => field.kind === 'number' && Number.isNaN(formValues[field.name]))) {
			setFieldError('Numeric fields must contain valid numbers.')
			return
		}

		const payload = Object.fromEntries(
			resource.fields
				.filter((field) => formValues[field.name] !== undefined && formValues[field.name] !== '')
				.map((field) => [field.name, formValues[field.name]]),
		)

		setSaving(true)
		setFieldError('')
		try {
			if (editingRecord?.id !== undefined) {
				await apiClient.put(`${resource.endpoint}${editingRecord.id}`, payload)
			} else {
				await apiClient.post(resource.endpoint, payload)
			}
			setDialogOpen(false)
			await loadRecords()
		} catch {
			setFieldError(`Unable to save this ${resource.label.toLowerCase()} record.`)
		} finally {
			setSaving(false)
		}
	}

	const deleteRecord = async (record: AdminRecord) => {
		if (record.id === undefined || !window.confirm(`Delete this ${resource.label.toLowerCase()} record?`)) return
		setError('')
		try {
			await apiClient.delete(`${resource.endpoint}${record.id}`)
			await loadRecords()
		} catch {
			setError(`Unable to delete this ${resource.label.toLowerCase()} record.`)
		}
	}

	return (
		<Stack spacing={3}>
			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
				<div>
					<Typography variant="h4">{resource.label}</Typography>
					<Typography color="text.secondary" variant="body2">
						Manage live backend records.
					</Typography>
				</div>
				<Stack direction="row" spacing={1}>
					<Button onClick={() => navigate('/admin')} variant="outlined">
						All tables
					</Button>
					<Button onClick={openAdd} variant="contained">
						Add record
					</Button>
				</Stack>
			</Stack>

			{error && <Alert severity="error">{error}</Alert>}

			<TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 220px)' }}>
				<Table stickyHeader size="small">
					<TableHead>
						<TableRow>
							<TableCell>ID</TableCell>
							{resource.fields.map((field) => (
								<TableCell key={field.name}>{field.label}</TableCell>
							))}
							<TableCell align="right">Actions</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{records.map((record) => (
							<TableRow hover key={String(record.id)}>
								<TableCell>{displayValue(record.id)}</TableCell>
								{resource.fields.map((field) => (
									<TableCell key={field.name}>{displayValue(record[field.name])}</TableCell>
								))}
								<TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
									<Button onClick={() => openEdit(record)} size="small">
										Edit
									</Button>
									<Button color="error" onClick={() => void deleteRecord(record)} size="small">
										Delete
									</Button>
								</TableCell>
							</TableRow>
						))}
						{!loading && records.length === 0 && (
							<TableRow>
								<TableCell align="center" colSpan={resource.fields.length + 2}>
									No records found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</TableContainer>

			<Dialog fullWidth maxWidth="md" onClose={closeDialog} open={dialogOpen}>
				<DialogTitle>{editingRecord ? `Edit ${resource.label}` : `Add ${resource.label}`}</DialogTitle>
				<DialogContent dividers>
					{fieldError && <Alert severity="error" sx={{ mb: 2 }}>{fieldError}</Alert>}
					<Grid container spacing={2} sx={{ pt: 1 }}>
						{resource.fields.map((field) => (
							<Grid key={field.name} size={{ xs: 12, sm: field.multiline ? 12 : 6 }}>
								<TextField
									fullWidth
									helperText={field.required ? `${field.label} is required.` : undefined}
									label={field.label}
									multiline={field.multiline}
									onChange={(event) => setValue(field, event.target.value)}
									required={field.required}
									select={field.kind === 'boolean'}
									type={field.kind === 'date' ? 'date' : field.kind === 'number' ? 'number' : 'text'}
									value={formValues[field.name] ?? ''}
									variant="outlined"
								>
									{field.kind === 'boolean' && (
										<>
															<MenuItem value={true}>Active</MenuItem>
															<MenuItem value={false}>Inactive</MenuItem>
										</>
									)}
								</TextField>
							</Grid>
						))}
					</Grid>
				</DialogContent>
				<DialogActions>
					<Button disabled={saving} onClick={closeDialog}>Cancel</Button>
					<Button disabled={saving} onClick={() => void saveRecord()} variant="contained">
						{saving ? 'Saving...' : 'Save'}
					</Button>
				</DialogActions>
			</Dialog>
		</Stack>
	)
}

export default AdminResourcePage
