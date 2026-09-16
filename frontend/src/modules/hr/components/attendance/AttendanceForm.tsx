import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Grid, Paper, Stack, TextField, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const attendanceSchema = z.object({
	employee_name: z
		.string()
		.trim()
		.min(1, 'Employee name is required')
		.max(150, 'Employee name must be 150 characters or less'),
	cl: z.number().int('CL must be a whole number').optional(),
	el: z.number().int('EL must be a whole number').optional(),
	pl: z.number().int('PL must be a whole number').optional(),
	lop: z.number().int('LOP must be a whole number').optional(),
	nh: z.number().int('NH must be a whole number').optional(),
	sundays: z.number().int('Sundays must be a whole number').optional(),
	other_paid: z.number().int('Other paid days must be a whole number').optional(),
	net_present_days: z
		.number()
		.int('Net present days must be a whole number'),
})

type AttendanceFormData = z.infer<typeof attendanceSchema>

const attendanceNumberFields = [
	{ name: 'cl', label: 'CL' },
	{ name: 'el', label: 'EL' },
	{ name: 'pl', label: 'PL' },
	{ name: 'lop', label: 'LOP' },
	{ name: 'nh', label: 'NH' },
	{ name: 'sundays', label: 'Sundays' },
	{ name: 'other_paid', label: 'Other paid days' },
	{ name: 'net_present_days', label: 'Net present days' },
] as const

function AttendanceForm() {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<AttendanceFormData>({
		resolver: zodResolver(attendanceSchema),
		defaultValues: {
			employee_name: '',
			cl: 0,
			el: 0,
			pl: 0,
			lop: 0,
			nh: 0,
			sundays: 0,
			other_paid: 0,
			net_present_days: 0,
		},
	})

	const onSubmit = (_data: AttendanceFormData) => undefined

	return (
		<Paper
			component="form"
			onSubmit={handleSubmit(onSubmit)}
			sx={{ p: { xs: 2, md: 4 } }}
		>
			<Stack spacing={3}>
				<div>
					<Typography variant="h5">Attendance</Typography>
					<Typography color="text.secondary" variant="body2">
						Capture employee attendance and leave details.
					</Typography>
				</div>

				<Grid container spacing={2}>
					<Grid size={{ xs: 12 }}>
						<TextField
							{...register('employee_name')}
							error={!!errors.employee_name}
							helperText={errors.employee_name?.message}
							label="Employee name"
							required
							fullWidth
						/>
					</Grid>

					{attendanceNumberFields.map(({ name, label }) => (
						<Grid key={name} size={{ xs: 12, sm: 6, md: 3 }}>
							<TextField
								{...register(name, {
									setValueAs: (value) =>
										value === '' ? undefined : Number(value),
								})}
								error={!!errors[name]}
								helperText={errors[name]?.message}
								label={label}
								type="number"
								fullWidth
							/>
						</Grid>
					))}
				</Grid>

				<Button
					type="submit"
					variant="contained"
					sx={{ alignSelf: 'flex-start' }}
				>
					Submit attendance
				</Button>
			</Stack>
		</Paper>
	)
}

export default AttendanceForm
