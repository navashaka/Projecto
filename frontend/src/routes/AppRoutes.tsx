import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AdminPage from '../modules/admin/AdminPage.tsx'
import AdminResourcePage from '../modules/admin/AdminResourcePage.tsx'
import SalaryBreakupPage from '../modules/admin/SalaryBreakupPage.tsx'
import CreateAttendancePage from '../modules/hr/pages/attendance/CreateAttendancePage.tsx'
import CreateEmployeePage from '../modules/hr/pages/employees/CreateEmployeePage.tsx'
import CreateEmploymentDetailsPage from '../modules/hr/pages/employment/CreateEmploymentDetailsPage.tsx'
import CreateJobProfilePage from '../modules/hr/pages/job-profile/CreateJobProfilePage.tsx'
import CreateOnEmploymentPage from '../modules/hr/pages/on-employment/CreateOnEmploymentPage.tsx'
import CreateSalaryDetailsPage from '../modules/hr/pages/salary/CreateSalaryDetailsPage.tsx'
import CreateTravellingAdvancePage from '../modules/hr/pages/travelling-advance/CreateTravellingAdvancePage.tsx'
import CreateTravellingExpensesReimbursementPage from '../modules/hr/pages/travelling-expenses-reimbursement/CreateTravellingExpensesReimbursementPage.tsx'

function AppRoutes() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/admin" element={<AdminPage />} />
				<Route path="/admin/salary-breakup" element={<SalaryBreakupPage />} />
				<Route path="/admin/:resourceKey" element={<AdminResourcePage />} />
				<Route path="/attendance/create" element={<CreateAttendancePage />} />
				<Route path="/employees/create" element={<CreateEmployeePage />} />
				<Route path="/employment/create" element={<CreateEmploymentDetailsPage />} />
				<Route path="/job-profile/create" element={<CreateJobProfilePage />} />
				<Route path="/on-employment/create" element={<CreateOnEmploymentPage />} />
				<Route path="/salary/create" element={<CreateSalaryDetailsPage />} />
				<Route path="/travelling-advance/create" element={<CreateTravellingAdvancePage />} />
				<Route
					path="/travelling-expenses-reimbursement/create"
					element={<CreateTravellingExpensesReimbursementPage />}
				/>
			</Routes>
		</BrowserRouter>
	)
}

export default AppRoutes