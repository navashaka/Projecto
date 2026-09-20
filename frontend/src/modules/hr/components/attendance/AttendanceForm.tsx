import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Grid, Paper, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

const attendanceSchema = z.object({
	user_id: z.number().int('User ID must be a whole number'),
	cl: z.number().int('CL must be a whole number').optional(),
	el: z.number().int('EL must be a whole number').optional(),
	pl: z.number().int('PL must be a whole number').optional(),
	lop: z.number().int('LOP must be a whole number').optional(),
	nh: z.number().int('NH must be a whole number').optional(),
	sundays: z.number().int('Sundays must be a whole number').optional(),
	other_paid_days: z
		.number()
		.int('Other paid days must be a whole number')
		.optional(),
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
	{ name: 'other_paid_days', label: 'Other paid days' },
	{ name: 'net_present_days', label: 'Net present days' },
] as const

function AttendanceForm() {
	const navigate = useNavigate()
	const [saving, setSaving] = useState(false)
	const [saved, setSaved] = useState(false)

	const {
		register,
		handleSubmit,
		getValues,
		formState: { errors },
	} = useForm<AttendanceFormData>({
		resolver: zodResolver(attendanceSchema),
		defaultValues: {
			user_id: 1,
			cl: 0,
			el: 0,
			pl: 0,
			lop: 0,
			nh: 0,
			sundays: 0,
			other_paid_days: 0,
			net_present_days: 0,
		},
	})

	const onSubmit = async (data: AttendanceFormData) => {
		try {
			setSaving(true)

			const response = await fetch(
				'http://localhost:8000/api/v1/attendance/',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						user_id: data.user_id,
						cl: data.cl ?? 0,
						el: data.el ?? 0,
						pl: data.pl ?? 0,
						lop: data.lop ?? 0,
						nh: data.nh ?? 0,
						sundays: data.sundays ?? 0,
						other_paid_days: data.other_paid_days ?? 0,
						net_present_days: data.net_present_days,
					}),
				},
			)

			if (!response.ok) {
				const errorData = await response.text()
				throw new Error(errorData || 'Failed to save attendance')
			}

			setSaved(true)
			alert('Attendance saved successfully')
		} catch (error) {
			console.error(error)
			alert('Unable to save attendance')
		} finally {
			setSaving(false)
		}
	}

	const handleNext = () => {
		const userId = getValues('user_id')

		navigate('/admin/paysheet', {
			state: {
				userId,
			},
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
					<Typography variant="h5">Attendance</Typography>
					<Typography color="text.secondary" variant="body2">
						Capture employee attendance and leave details.
					</Typography>
				</div>

				<Grid container spacing={2}>
					<Grid size={{ xs: 12 }}>
						<TextField
							{...register('user_id', {
								setValueAs: (value) =>
									value === '' ? undefined : Number(value),
							})}
							error={!!errors.user_id}
							helperText={errors.user_id?.message}
							label="User ID"
							type="number"
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

				<Stack direction="row" spacing={2}>
					<Button
						type="submit"
						variant="contained"
						disabled={saving}
					>
						{saving ? 'Saving...' : 'Save Attendance'}
					</Button>

					<Button
						type="button"
						variant="contained"
						disabled={!saved}
						onClick={handleNext}
					>
						Next
					</Button>
				</Stack>
			</Stack>
		</Paper>
	)
}

export default AttendanceForm