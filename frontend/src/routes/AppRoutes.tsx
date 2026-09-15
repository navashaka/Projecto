import { BrowserRouter, Route, Routes } from 'react-router-dom'
import CreateEmployeePage from '../modules/hr/pages/employees/CreateEmployeePage.tsx'

function AppRoutes() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/employees/create" element={<CreateEmployeePage />} />
			</Routes>
		</BrowserRouter>
	)
}

export default AppRoutes
