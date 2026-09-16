import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import apiClient from '../../../../services/apiClient'

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

function EmployeeForm() {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<EmployeeEnquiryFormData>({
		resolver: zodResolver(employeeEnquirySchema),
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
		await apiClient.post('/api/v1/user-enquiries/', {
			candidate_name: data.candidate_name,
			father_name: data.father_name,
			date_of_birth: data.date_of_birth,
			blood_group: data.blood_group,
			marital_status: data.marital_status,
			address: data.address,
			phone: data.phone,
			pan: data.pan,
			aadhaar: data.aadhaar,
			passport_no: data.passport_no,
			personal_email: data.personal_email,
			emergency_phone_1: data.emergency_phone_1,
			emergency_phone_2: data.emergency_phone_2,
			mother_tongue: data.mother_tongue,
			other_languages_known: data.other_languages_known,
			religion: data.religion,
			nationality: data.nationality,
			highest_qualification: data.highest_qualification,
			year_of_pass: data.year_of_pass,
			highest_qualification_document: data.highest_qualification_document,
			year_of_pass_document: data.year_of_pass_document,
			current_employer: data.current_employer,
			current_position: data.current_position,
			department: data.department,
			working_period: data.working_period,
			role_responsibilities: data.role_responsibilities,
			current_ctc: data.current_ctc,
			employer_documents: data.employer_documents,
			previous_employer_name: data.previous_employer_name,
			previous_employer_position: data.previous_employer_position,
			previous_employer_department: data.previous_employer_department,
			previous_employer_working_period: data.previous_employer_working_period,
			previous_employer_role: data.previous_employer_role,
			previous_employer_ctc: data.previous_employer_ctc,
			previous_employer_documents: data.previous_employer_documents,
			is_active: data.is_active,
		})
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
					<Typography color="text.secondary" variant="body2">
						Capture candidate and employment information.
					</Typography>
				</div>

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

				<Button
					type="submit"
					variant="contained"
					sx={{ alignSelf: 'flex-start' }}
				>
					Submit enquiry
				</Button>
			</Stack>
		</Paper>
	)
}

export default EmployeeForm
