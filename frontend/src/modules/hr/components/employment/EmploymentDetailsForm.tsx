import { zodResolver } from '@hookform/resolvers/zod'
import {
	Button,
	Grid,
	Paper,
	Stack,
	TextField,
	Typography,
} from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

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

const employmentDetailsSchema = z.object({
	user_id: z.number().int('User ID must be a whole number'),
	employee_code: optionalText(50, 'Employee code'),
	designation: optionalText(150, 'Designation'),
	department: optionalText(150, 'Department'),
	immediate_reporting_head: optionalText(
		150,
		'Immediate reporting head',
	),
	department_head: optionalText(150, 'Department head'),
	location: optionalText(150, 'Location'),
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
})

type EmploymentDetailsFormData =
	z.infer<typeof employmentDetailsSchema>

const employmentTextFields = [
	{ name: 'employee_code', label: 'Employee code', maxLength: 50 },
	{ name: 'designation', label: 'Designation', maxLength: 150 },
	{ name: 'department', label: 'Department', maxLength: 150 },
	{
		name: 'immediate_reporting_head',
		label: 'Immediate reporting head',
		maxLength: 150,
	},
	{
		name: 'department_head',
		label: 'Department head',
		maxLength: 150,
	},
	{ name: 'location', label: 'Location', maxLength: 150 },
	{ name: 'epf_uan', label: 'EPF UAN', maxLength: 50 },
	{ name: 'esi', label: 'ESI', maxLength: 50 },
	{
		name: 'health_insurance',
		label: 'Health insurance',
		maxLength: 150,
	},
	{
		name: 'bank_account_name',
		label: 'Bank account name',
		maxLength: 150,
	},
	{
		name: 'account_no',
		label: 'Account number',
		maxLength: 50,
	},
	{ name: 'bank', label: 'Bank', maxLength: 150 },
	{ name: 'branch', label: 'Branch', maxLength: 150 },
	{ name: 'ifsc', label: 'IFSC', maxLength: 20 },
] as const

function EmploymentDetailsForm() {
	const navigate = useNavigate()

	const [saving, setSaving] = useState(false)
	const [saved, setSaved] = useState(false)

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<EmploymentDetailsFormData>({
		resolver: zodResolver(employmentDetailsSchema),

		defaultValues: {
			user_id: undefined,
			employee_code: '',
			designation: '',
			department: '',
			immediate_reporting_head: '',
			department_head: '',
			location: '',
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
		},
	})

	const onSubmit = async (
		data: EmploymentDetailsFormData,
	) => {
		try {
			setSaving(true)
			setSaved(false)

			const response = await fetch(
				'http://localhost:8000/api/v1/employment/',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(data),
				},
			)

			const result = await response.json()

			if (!response.ok) {
				throw new Error(
					result?.detail ||
						'Failed to save employment details',
				)
			}

			console.log(
				'Employment details saved:',
				result,
			)

			setSaved(true)

			alert(
				'Employment details saved successfully',
			)
		} catch (error) {
			console.error(
				'Employment save error:',
				error,
			)

			alert(
				error instanceof Error
					? error.message
					: 'Failed to save employment details',
			)
		} finally {
			setSaving(false)
		}
	}

	const handleNext = () => {
		if (!saved) {
			alert(
				'Please save Employment Details first',
			)
			return
		}

		navigate('/admin/salary-breakup')
	}

	return (
		<Paper
			component="form"
			onSubmit={handleSubmit(onSubmit)}
			sx={{
				p: {
					xs: 2,
					md: 4,
				},
			}}
		>
			<Stack spacing={3}>
				<div>
					<Typography variant="h5">
						Employment details
					</Typography>

					<Typography
						color="text.secondary"
						variant="body2"
					>
						Capture employee employment and
						banking information.
					</Typography>
				</div>

				<Grid container spacing={2}>
					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('user_id', {
								valueAsNumber: true,
							})}
							error={!!errors.user_id}
							helperText={
								errors.user_id?.message
							}
							label="User ID"
							type="number"
							required
							fullWidth
						/>
					</Grid>

					{employmentTextFields.map(
						({ name, label, maxLength }) => (
							<Grid
								key={name}
								size={{ xs: 12, sm: 6 }}
							>
								<TextField
									{...register(name)}
									error={!!errors[name]}
									helperText={
										errors[name]?.message
									}
									label={label}
									slotProps={{
										htmlInput: {
											maxLength,
										},
									}}
									fullWidth
								/>
							</Grid>
						),
					)}

					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register(
								'health_insurance_date',
							)}
							error={
								!!errors.health_insurance_date
							}
							helperText={
								errors.health_insurance_date
									?.message
							}
							label="Health insurance date"
							type="date"
							slotProps={{
								inputLabel: {
									shrink: true,
								},
							}}
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12, sm: 6 }}>
						<TextField
							{...register('work_email')}
							error={!!errors.work_email}
							helperText={
								errors.work_email?.message
							}
							label="Work email"
							type="email"
							slotProps={{
								htmlInput: {
									maxLength: 150,
								},
							}}
							fullWidth
						/>
					</Grid>
				</Grid>

				<Stack
					direction={{
						xs: 'column',
						sm: 'row',
					}}
					spacing={2}
				>
					<Button
						type="submit"
						variant="contained"
						disabled={saving}
					>
						{saving ? 'Saving...' : 'Save'}
					</Button>

					<Button
						type="button"
						variant="outlined"
						disabled={!saved || saving}
						onClick={handleNext}
					>
						Next
					</Button>
				</Stack>
			</Stack>
		</Paper>
	)
}

export default EmploymentDetailsForm