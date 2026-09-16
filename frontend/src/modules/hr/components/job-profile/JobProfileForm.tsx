import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const jobProfileSchema = z.object({
	job_description: z.string().trim().optional().or(z.literal('')),
})

type JobProfileFormData = z.infer<typeof jobProfileSchema>

function JobProfileForm() {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<JobProfileFormData>({
		resolver: zodResolver(jobProfileSchema),
		defaultValues: {
			job_description: '',
		},
	})

	const onSubmit = (_data: JobProfileFormData) => undefined

	return (
		<Paper
			component="form"
			onSubmit={handleSubmit(onSubmit)}
			sx={{ p: { xs: 2, md: 4 } }}
		>
			<Stack spacing={3}>
				<div>
					<Typography variant="h5">Job profile</Typography>
					<Typography color="text.secondary" variant="body2">
						Capture the job description.
					</Typography>
				</div>

				<TextField
					{...register('job_description')}
					error={!!errors.job_description}
					helperText={errors.job_description?.message}
					label="Job description"
					multiline
					minRows={5}
					fullWidth
				/>

				<Button
					type="submit"
					variant="contained"
					sx={{ alignSelf: 'flex-start' }}
				>
					Submit job profile
				</Button>
			</Stack>
		</Paper>
	)
}

export default JobProfileForm
