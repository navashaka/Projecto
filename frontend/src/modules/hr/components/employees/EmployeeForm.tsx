import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import apiClient from '../../../../services/apiClient'

const optionalText = (max = 255, label = 'Value') =>
	z.string().trim().max(max, `${label} must be ${max} characters or less`).optional().or(z.literal(''))
const optionalPattern = (pattern: RegExp, message: string) =>
	z.string().trim().regex(pattern, message).optional().or(z.literal(''))
const phone = /^[6-9]\d{9}$/
const fileList = z.custom<FileList>((value) => typeof FileList !== 'undefined' && value instanceof FileList).optional()

const employeeEnquirySchema = z.object({
	candidate_name: z.string().trim().min(1, 'Candidate name is required').min(2, 'Candidate name must be at least 2 characters'),
	father_name: z.string().trim().min(2, 'Father name must be at least 2 characters').optional().or(z.literal('')),
	date_of_birth: z.string().refine((value) => {
		if (value === '' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value === ''
		const [year, month, day] = value.split('-').map(Number)
		const date = new Date(year, month - 1, day)
		return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
	}, 'Enter a valid date').optional().or(z.literal('')),
	blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).or(z.literal('')).optional(),
	marital_status: z.enum(['single', 'married', 'other']).or(z.literal('')).optional(),
	address: optionalText(500, 'Address'),
	phone: z.string().trim().min(1, 'Phone number is required').regex(phone, 'Enter a valid 10-digit Indian mobile number'),
	pan: optionalPattern(/^[A-Z]{5}\d{4}[A-Z]$/, 'Enter a valid PAN'),
	aadhaar: optionalPattern(/^\d{12}$/, 'Aadhaar must be exactly 12 digits'),
	passport_no: optionalPattern(/^[A-Z]\d{7}$/, 'Enter a valid passport number'),
	personal_email: z.string().trim().email('Enter a valid email address').optional().or(z.literal('')),
	emergency_phone: optionalPattern(phone, 'Enter a valid 10-digit Indian mobile number'),
	emergency_phone2: optionalPattern(phone, 'Enter a valid 10-digit Indian mobile number'),
	mother_tongue: optionalText(255, 'Mother tongue'),
	other_languages: optionalText(255, 'Other languages'),
	religion: optionalText(255, 'Religion'),
	nationality: optionalText(255, 'Nationality'),
	highest_qualification: optionalText(255, 'Highest qualification'),
	year_of_pass: optionalPattern(/^\d{4}$/, 'Year of pass must be 4 digits'),
	qualification_certificate: fileList,
	current_employer: optionalText(255, 'Current employer'),
	position: optionalText(255, 'Position'),
	department: optionalText(255, 'Department'),
	working_period: optionalText(255, 'Working period'),
	role_responsibilities_achievements: optionalText(1000, 'Responsibilities and achievements'),
	current_ctc: optionalPattern(/^\d+(\.\d{1,2})?$/, 'Enter a valid numeric amount'),
	employment_documents: fileList,
})

type EmployeeEnquiryFormData = z.infer<typeof employeeEnquirySchema>

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
			emergency_phone: '',
			emergency_phone2: '',
			mother_tongue: '',
			other_languages: '',
			religion: '',
			nationality: '',
			highest_qualification: '',
			year_of_pass: '',
			current_employer: '',
			position: '',
			department: '',
			working_period: '',
			role_responsibilities_achievements: '',
			current_ctc: '',
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
			emergency_phone_1: data.emergency_phone,
			emergency_phone_2: data.emergency_phone2,
			mother_tongue: data.mother_tongue,
			other_languages_known: data.other_languages,
			religion: data.religion,
			nationality: data.nationality,
			highest_qualification: data.highest_qualification,
			year_of_pass: data.year_of_pass,
			highest_qualification_document: data.qualification_certificate?.item(0)?.name,
			current_employer: data.current_employer,
			current_position: data.position,
			department: data.department,
			working_period: data.working_period,
			role_responsibilities: data.role_responsibilities_achievements,
			current_ctc: data.current_ctc,
			employer_documents: data.employment_documents?.item(0)?.name,
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

						<Grid size={{ xs: 12, md: 6 }}>
							<TextField
								{...register('father_name')}
								error={!!errors.father_name}
								helperText={errors.father_name?.message}
								label="Father name"
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
								slotProps={{
									inputLabel: { shrink: true },
								}}
								fullWidth
							/>
						</Grid>

						<Grid size={{ xs: 12, md: 4 }}>
							<TextField
								{...register('blood_group')}
								error={!!errors.blood_group}
								helperText={errors.blood_group?.message}
								label="Blood group"
								select
								fullWidth
							>
								<MenuItem value="">Not specified</MenuItem>

								{[
									'A+',
									'A-',
									'B+',
									'B-',
									'AB+',
									'AB-',
									'O+',
									'O-',
								].map((group) => (
									<MenuItem key={group} value={group}>
										{group}
									</MenuItem>
								))}
							</TextField>
						</Grid>

						<Grid size={{ xs: 12, md: 4 }}>
							<TextField
								{...register('marital_status')}
								error={!!errors.marital_status}
								helperText={errors.marital_status?.message}
								label="Marital status"
								select
								fullWidth
							>
								<MenuItem value="">Not specified</MenuItem>
								<MenuItem value="single">Single</MenuItem>
								<MenuItem value="married">Married</MenuItem>
								<MenuItem value="other">Other</MenuItem>
							</TextField>
						</Grid>

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
						<Grid size={{ xs: 12, md: 4 }}>
							<TextField
								{...register('phone')}
								error={!!errors.phone}
								helperText={errors.phone?.message}
								label="Phone"
								required
								fullWidth
							/>
						</Grid>

						<Grid size={{ xs: 12, md: 4 }}>
							<TextField
								{...register('personal_email')}
								error={!!errors.personal_email}
								helperText={errors.personal_email?.message}
								label="Personal email"
								type="email"
								fullWidth
							/>
						</Grid>

						<Grid size={{ xs: 12, md: 4 }}>
							<TextField
								{...register('nationality')}
								error={!!errors.nationality}
								helperText={errors.nationality?.message}
								label="Nationality"
								fullWidth
							/>
						</Grid>

						<Grid size={{ xs: 12, md: 4 }}>
							<TextField
								{...register('pan')}
								error={!!errors.pan}
								helperText={errors.pan?.message}
								label="PAN"
								fullWidth
							/>
						</Grid>

						<Grid size={{ xs: 12, md: 4 }}>
							<TextField
								{...register('aadhaar')}
								error={!!errors.aadhaar}
								helperText={errors.aadhaar?.message}
								label="Aadhaar"
								fullWidth
							/>
						</Grid>

						<Grid size={{ xs: 12, md: 4 }}>
							<TextField
								{...register('passport_no')}
								error={!!errors.passport_no}
								helperText={errors.passport_no?.message}
								label="Passport number"
								fullWidth
							/>
						</Grid>

						<Grid size={{ xs: 12, md: 4 }}>
							<TextField
								{...register('emergency_phone')}
								error={!!errors.emergency_phone}
								helperText={errors.emergency_phone?.message}
								label="Emergency phone"
								fullWidth
							/>
						</Grid>

						<Grid size={{ xs: 12, md: 4 }}>
							<TextField
								{...register('emergency_phone2')}
								error={!!errors.emergency_phone2}
								helperText={errors.emergency_phone2?.message}
								label="Emergency phone 2"
								fullWidth
							/>
						</Grid>

						<Grid size={{ xs: 12, md: 4 }}>
							<TextField
								{...register('mother_tongue')}
								error={!!errors.mother_tongue}
								helperText={errors.mother_tongue?.message}
								label="Mother tongue"
								fullWidth
							/>
						</Grid>

						<Grid size={{ xs: 12, md: 4 }}>
							<TextField
								{...register('other_languages')}
								error={!!errors.other_languages}
								helperText={errors.other_languages?.message}
								label="Other languages"
								fullWidth
							/>
						</Grid>

						<Grid size={{ xs: 12, md: 4 }}>
							<TextField
								{...register('religion')}
								error={!!errors.religion}
								helperText={errors.religion?.message}
								label="Religion"
								fullWidth
							/>
						</Grid>
					</Grid>
				</Stack>

				<Stack spacing={2}>
					<Typography variant="h6">
						Qualification and employment
					</Typography>

					<Grid container spacing={2}>
						<Grid size={{ xs: 12, md: 6 }}>
							<TextField
								{...register('highest_qualification')}
								error={!!errors.highest_qualification}
								helperText={errors.highest_qualification?.message}
								label="Highest qualification"
								fullWidth
							/>
						</Grid>

						<Grid size={{ xs: 12, md: 6 }}>
							<TextField
								{...register('year_of_pass')}
								error={!!errors.year_of_pass}
								helperText={errors.year_of_pass?.message}
								label="Year of pass"
								type="number"
								fullWidth
							/>
						</Grid>

						<Grid size={{ xs: 12, md: 6 }}>
							<TextField
								{...register('current_employer')}
								error={!!errors.current_employer}
								helperText={errors.current_employer?.message}
								label="Current employer"
								fullWidth
							/>
						</Grid>

						<Grid size={{ xs: 12, md: 6 }}>
							<TextField
								{...register('position')}
								error={!!errors.position}
								helperText={errors.position?.message}
								label="Position"
								fullWidth
							/>
						</Grid>

						<Grid size={{ xs: 12, md: 6 }}>
							<TextField
								{...register('department')}
								error={!!errors.department}
								helperText={errors.department?.message}
								label="Department"
								fullWidth
							/>
						</Grid>

						<Grid size={{ xs: 12, md: 6 }}>
							<TextField
								{...register('working_period')}
								error={!!errors.working_period}
								helperText={errors.working_period?.message}
								label="Working period"
								fullWidth
							/>
						</Grid>

						<Grid size={{ xs: 12, md: 6 }}>
							<TextField
								{...register('current_ctc')}
								error={!!errors.current_ctc}
								helperText={errors.current_ctc?.message}
								label="Current CTC"
								fullWidth
							/>
						</Grid>

						<Grid size={{ xs: 12, md: 6 }}>
							<TextField
								{...register('qualification_certificate')}
								error={!!errors.qualification_certificate}
								helperText={errors.qualification_certificate?.message}
								label="Qualification certificate"
								type="file"
								slotProps={{
									htmlInput: {
										accept: '.pdf,.jpg,.jpeg,.png',
									},
									inputLabel: { shrink: true },
								}}
								fullWidth
							/>
						</Grid>

						<Grid size={{ xs: 12, md: 6 }}>
							<TextField
								{...register('employment_documents')}
								error={!!errors.employment_documents}
								helperText={errors.employment_documents?.message}
								label="Employment documents"
								type="file"
								slotProps={{
									htmlInput: {
										accept: '.pdf,.jpg,.jpeg,.png',
										multiple: true,
									},
									inputLabel: { shrink: true },
								}}
								fullWidth
							/>
						</Grid>

						<Grid size={{ xs: 12 }}>
							<TextField
								{...register(
									'role_responsibilities_achievements',
								)}
								error={
									!!errors.role_responsibilities_achievements
								}
								helperText={
									errors.role_responsibilities_achievements
										?.message
								}
								label="Role responsibilities and achievements"
								multiline
								minRows={4}
								fullWidth
							/>
						</Grid>
					</Grid>
				</Stack>

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