import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const optionalText = z.string().trim().optional().or(z.literal(''))

const employeeEnquirySchema = z.object({
	candidate_name: z.string().trim().min(1, 'Candidate name is required'),
	father_name: optionalText,
	date_of_birth: optionalText,
	blood_group: optionalText,
	marital_status: optionalText,
	address: optionalText,
	phone: z.string().trim().min(1, 'Phone number is required'),
	pan: optionalText,
	aadhaar: optionalText,
	passport_no: optionalText,
	personal_email: z.union([z.string().trim().email('Enter a valid email address'), z.literal('')]).optional(),
	emergency_phone: optionalText,
	emergency_phone2: optionalText,
	mother_tongue: optionalText,
	other_languages: optionalText,
	religion: optionalText,
	nationality: optionalText,
	highest_qualification: optionalText,
	year_of_pass: optionalText,
	qualification_certificate: z.custom<FileList>((value) => typeof FileList !== 'undefined' && value instanceof FileList).optional(),
	current_employer: optionalText,
	position: optionalText,
	department: optionalText,
	working_period: optionalText,
	role_responsibilities_achievements: optionalText,
	current_ctc: optionalText,
	employment_documents: z.custom<FileList>((value) => typeof FileList !== 'undefined' && value instanceof FileList).optional(),
})

type EmployeeEnquiryFormData = z.infer<typeof employeeEnquirySchema>

function EmployeeForm() {
	const { register, handleSubmit, formState: { errors } } = useForm<EmployeeEnquiryFormData>({
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

	const onSubmit = (data: EmployeeEnquiryFormData) => {
		console.log(data)
	}

	return (
		<Paper component="form" onSubmit={handleSubmit(onSubmit)} sx={{ p: { xs: 2, md: 4 } }}>
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
							<TextField {...register('candidate_name')} error={!!errors.candidate_name} helperText={errors.candidate_name?.message} label="Candidate name" required fullWidth />
						</Grid>
						<Grid size={{ xs: 12, md: 6 }}><TextField {...register('father_name')} label="Father name" fullWidth /></Grid>
						<Grid size={{ xs: 12, md: 4 }}><TextField {...register('date_of_birth')} label="Date of birth" type="date" slotProps={{ inputLabel: { shrink: true } }} fullWidth /></Grid>
						<Grid size={{ xs: 12, md: 4 }}>
							<TextField {...register('blood_group')} label="Blood group" select fullWidth>
								<MenuItem value="">Not specified</MenuItem>
								{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => <MenuItem key={group} value={group}>{group}</MenuItem>)}
							</TextField>
						</Grid>
						<Grid size={{ xs: 12, md: 4 }}>
							<TextField {...register('marital_status')} label="Marital status" select fullWidth>
								<MenuItem value="">Not specified</MenuItem>
								<MenuItem value="single">Single</MenuItem>
								<MenuItem value="married">Married</MenuItem>
								<MenuItem value="other">Other</MenuItem>
							</TextField>
						</Grid>
						<Grid size={{ xs: 12 }}><TextField {...register('address')} label="Address" multiline minRows={2} fullWidth /></Grid>
					</Grid>
				</Stack>

				<Stack spacing={2}>
					<Typography variant="h6">Contact and identity</Typography>
					<Grid container spacing={2}>
						<Grid size={{ xs: 12, md: 4 }}><TextField {...register('phone')} error={!!errors.phone} helperText={errors.phone?.message} label="Phone" required fullWidth /></Grid>
						<Grid size={{ xs: 12, md: 4 }}><TextField {...register('personal_email')} error={!!errors.personal_email} helperText={errors.personal_email?.message} label="Personal email" type="email" fullWidth /></Grid>
						<Grid size={{ xs: 12, md: 4 }}><TextField {...register('nationality')} label="Nationality" fullWidth /></Grid>
						<Grid size={{ xs: 12, md: 4 }}><TextField {...register('pan')} label="PAN" fullWidth /></Grid>
						<Grid size={{ xs: 12, md: 4 }}><TextField {...register('aadhaar')} label="Aadhaar" fullWidth /></Grid>
						<Grid size={{ xs: 12, md: 4 }}><TextField {...register('passport_no')} label="Passport number" fullWidth /></Grid>
						<Grid size={{ xs: 12, md: 4 }}><TextField {...register('emergency_phone')} label="Emergency phone" fullWidth /></Grid>
						<Grid size={{ xs: 12, md: 4 }}><TextField {...register('emergency_phone2')} label="Emergency phone 2" fullWidth /></Grid>
						<Grid size={{ xs: 12, md: 4 }}><TextField {...register('mother_tongue')} label="Mother tongue" fullWidth /></Grid>
						<Grid size={{ xs: 12, md: 4 }}><TextField {...register('other_languages')} label="Other languages" fullWidth /></Grid>
						<Grid size={{ xs: 12, md: 4 }}><TextField {...register('religion')} label="Religion" fullWidth /></Grid>
					</Grid>
				</Stack>

				<Stack spacing={2}>
					<Typography variant="h6">Qualification and employment</Typography>
					<Grid container spacing={2}>
						<Grid size={{ xs: 12, md: 6 }}><TextField {...register('highest_qualification')} label="Highest qualification" fullWidth /></Grid>
						<Grid size={{ xs: 12, md: 6 }}><TextField {...register('year_of_pass')} label="Year of pass" type="number" fullWidth /></Grid>
						<Grid size={{ xs: 12, md: 6 }}><TextField {...register('current_employer')} label="Current employer" fullWidth /></Grid>
						<Grid size={{ xs: 12, md: 6 }}><TextField {...register('position')} label="Position" fullWidth /></Grid>
						<Grid size={{ xs: 12, md: 6 }}><TextField {...register('department')} label="Department" fullWidth /></Grid>
						<Grid size={{ xs: 12, md: 6 }}><TextField {...register('working_period')} label="Working period" fullWidth /></Grid>
						<Grid size={{ xs: 12, md: 6 }}><TextField {...register('current_ctc')} label="Current CTC" fullWidth /></Grid>
						<Grid size={{ xs: 12, md: 6 }}><TextField {...register('qualification_certificate')} label="Qualification certificate" type="file" slotProps={{ htmlInput: { accept: '.pdf,.jpg,.jpeg,.png' }, inputLabel: { shrink: true } }} fullWidth /></Grid>
						<Grid size={{ xs: 12, md: 6 }}><TextField {...register('employment_documents')} label="Employment documents" type="file" slotProps={{ htmlInput: { accept: '.pdf,.jpg,.jpeg,.png', multiple: true }, inputLabel: { shrink: true } }} fullWidth /></Grid>
						<Grid size={{ xs: 12 }}><TextField {...register('role_responsibilities_achievements')} label="Role responsibilities and achievements" multiline minRows={4} fullWidth /></Grid>
					</Grid>
				</Stack>

				<Button type="submit" variant="contained" sx={{ alignSelf: 'flex-start' }}>Submit enquiry</Button>
			</Stack>
		</Paper>
	)
}

export default EmployeeForm
