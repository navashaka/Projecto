import {
	Button,
	Paper,
	Stack,
	Typography,
} from '@mui/material'
import { useState } from 'react'

function CompanyHolidayUploadPage() {
	const [file, setFile] = useState<File | null>(null)
	const [uploading, setUploading] = useState(false)

	const handleUpload = async () => {
		if (!file) {
			alert('Please select a CSV file')
			return
		}

		try {
			setUploading(true)

			const formData = new FormData()
			formData.append('file', file)

			const response = await fetch(
				'http://localhost:8000/api/v1/company-holidays/upload',
				{
					method: 'POST',
					body: formData,
				},
			)

			const result = await response.json()

			if (!response.ok) {
				throw new Error(
					result?.detail ||
						'Failed to upload holiday list',
				)
			}

			alert(
				`${result.uploaded_count} holidays uploaded successfully`,
			)

			setFile(null)
		} catch (error) {
			console.error(error)

			alert(
				error instanceof Error
					? error.message
					: 'Unable to upload holiday list',
			)
		} finally {
			setUploading(false)
		}
	}

	return (
		<Paper
			sx={{
				p: {
					xs: 2,
					md: 4,
				},
			}}
		>
			<Stack spacing={3}>
				<Typography variant="h5">
					Company Holiday Upload
				</Typography>

				<Typography>
					Upload the company holiday list as
					a CSV file.
				</Typography>

				<input
					type="file"
					accept=".csv"
					onChange={(event) =>
						setFile(
							event.target.files?.[0] ??
								null,
						)
					}
				/>

				{file && (
					<Typography>
						Selected file: {file.name}
					</Typography>
				)}

				<Button
					variant="contained"
					onClick={handleUpload}
					disabled={
						uploading || !file
					}
				>
					{uploading
						? 'Uploading...'
						: 'Upload Holiday List'}
				</Button>
			</Stack>
		</Paper>
	)
}

export default CompanyHolidayUploadPage