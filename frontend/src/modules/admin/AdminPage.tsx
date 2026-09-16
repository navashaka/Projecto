import { Button, Grid, Paper, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { adminResources } from './resourceConfig'

function AdminPage() {
	const navigate = useNavigate()

	return (
		<Stack spacing={3}>
			<div>
				<Typography variant="h4">Admin</Typography>
				<Typography color="text.secondary" variant="body2">
					Manage live HR table records.
				</Typography>
			</div>

			<Grid container spacing={2}>
				{adminResources.map((resource) => (
					<Grid key={resource.key} size={{ xs: 12, sm: 6, md: 4 }}>
						<Paper sx={{ height: '100%', p: 3 }}>
							<Stack spacing={2}>
								<Typography variant="h6">{resource.label}</Typography>
								<Typography color="text.secondary" variant="body2">
									View and manage backend records.
								</Typography>
								<Button onClick={() => navigate(`/admin/${resource.key}`)} variant="contained">
									Open table
								</Button>
							</Stack>
						</Paper>
					</Grid>
				))}
			</Grid>
		</Stack>
	)
}

export default AdminPage
