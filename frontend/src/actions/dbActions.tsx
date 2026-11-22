import axios, { type AxiosResponse } from 'axios'
import type { UserRole, UserSession } from '../store'

const apiUrl = import.meta.env.VITE_API_URL
  ?? import.meta.env.VITE_API_BASE_URL
  ?? 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json'
  }
})

const configuredHRApiUrl = import.meta.env.VITE_HR_API_URL
  ?? import.meta.env.VITE_API_BASE_URL
  ?? 'http://127.0.0.1:8000'
const hrApiUrl =
  import.meta.env.DEV ||
  (typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    configuredHRApiUrl.startsWith('http:'))
    ? ''
    : configuredHRApiUrl

const hrApiClient = axios.create({
  baseURL: hrApiUrl,
  headers: {
    'Content-Type': 'application/json'
  }
})

export type ApiDispatchAction<T = unknown> = {
  type: string
  payload?: T
  error?: unknown
}

export const dispatchRequest = async <T,>(
  type: string,
  request: () => Promise<T>,
  dispatch?: (action: ApiDispatchAction<T>) => void
): Promise<T> =>
  request()
    .then((payload) => {
      dispatch?.({ type, payload })
      return payload
    })
    .catch((error: unknown) => {
      dispatch?.({ type: `${type}_FAILED`, error })
      throw error
    })

export type UserEnquiryPayload = {
  candidateName?: string
  fatherName?: string
  dob?: string
  bloodGroup?: string
  maritalStatus?: string
  religion?: string
  nationality?: string
  motherTongue?: string
  languagesKnown?: string
  address?: string
  phone?: string
  personalEmail?: string
  pan?: string
  aadhar?: string
  passportNo?: string
  emergencyPhone1?: string
  emergencyPhone2?: string
  highestQualification?: string
  yearOfPass?: string
  currentEmployer?: string
  position?: string
  department?: string
  workingPeriod?: string
  currentCtc?: string
  currentResponsibilities?: string
  previousEmployer?: string
  previousPosition?: string
  previousDepartment?: string
  previousWorkingPeriod?: string
  previousCtc?: string
  previousResponsibilities?: string
  highestQualificationDocument?: string
  yearOfPassDocument?: string
  employerDocuments?: string
  previousEmployerDocuments?: string
  qualificationDetails?: string
  previousEmploymentDetails?: string
  [key: string]: string | undefined
}

type EnquiryDetail = Record<string, string>

const readEnquiryDetails = (value: string | undefined): EnquiryDetail[] => {
  if (!value) return []

  const parsed: unknown = JSON.parse(value)
  if (
    !Array.isArray(parsed) ||
    !parsed.every((item) => typeof item === 'object' && item !== null)
  ) {
    throw new Error('Candidate Enquiry details have an invalid format.')
  }

  return parsed.map((item) =>
    Object.fromEntries(
      Object.entries(item).filter((entry): entry is [string, string] =>
        typeof entry[1] === 'string'
      )
    )
  )
}

const optionalValue = (value: string | undefined) =>
  value === undefined || value === '' ? null : value

export const normalizeUserEnquiryPayload = (payload: UserEnquiryPayload) => {
  const qualifications = readEnquiryDetails(payload.qualificationDetails)
    .map((item) => ({
      highest_qualification: optionalValue(item.highestQualification),
      year_of_pass: optionalValue(item.yearOfPassing),
      document: optionalValue(item.attachDocuments)
    }))
    .filter((item) => Object.values(item).some(Boolean))
  const previousEmployments = readEnquiryDetails(payload.previousEmploymentDetails)
    .map((item) => ({
      employer_name: optionalValue(item.previousEmployer),
      position: optionalValue(item.previousDesignation),
      department: optionalValue(item.previousDepartment),
      working_from: optionalValue(item.previousWorkingFrom),
      relieved_on: optionalValue(item.previousRelievedOn),
      ctc: optionalValue(item.previousCTC),
      take_home: optionalValue(item.previousTakeHome),
      responsibilities: optionalValue(item.previousResponsibilities),
      documents: optionalValue(item.previousEmployerDocuments)
    }))
    .filter((item) => Object.values(item).some(Boolean))

  const addressParts = [
    payload.streetNumber,
    payload.streetName,
    payload.city,
    payload.state,
    payload.country,
    payload.zipCode
  ].filter((part): part is string => Boolean(part))

  return {
    candidate_name: optionalValue(payload.candidateName),
    father_name: optionalValue(payload.fatherName),
    date_of_birth: optionalValue(payload.dob),
    blood_group: optionalValue(payload.bloodGroup),
    marital_status: optionalValue(payload.maritalStatus),
    religion: optionalValue(payload.religion),
    nationality: optionalValue(payload.nationality),
    mother_tongue: optionalValue(payload.motherTongue),
    other_languages_known: optionalValue(payload.otherLanguages ?? payload.languagesKnown),
    address: addressParts.length
      ? addressParts.join(', ')
      : optionalValue(payload.address),
    street_number: optionalValue(payload.streetNumber),
    street_name: optionalValue(payload.streetName),
    city: optionalValue(payload.city),
    state: optionalValue(payload.state),
    country: optionalValue(payload.country),
    zip_code: optionalValue(payload.zipCode),
    phone: optionalValue(payload.phone),
    personal_email: optionalValue(payload.email ?? payload.personalEmail),
    pan: optionalValue(payload.panNumber ?? payload.pan),
    aadhaar: optionalValue(payload.aadhaarNumber ?? payload.aadhar),
    passport_no: optionalValue(payload.passportNumber ?? payload.passportNo),
    emergency_phone_1: optionalValue(payload.emergencyContact1 ?? payload.emergencyPhone1),
    emergency_phone_2: optionalValue(payload.emergencyContact2 ?? payload.emergencyPhone2),
    highest_qualification: qualifications[0]?.highest_qualification
      ?? optionalValue(payload.highestQualification),
    year_of_pass: qualifications[0]?.year_of_pass
      ?? optionalValue(payload.yearOfPassing ?? payload.yearOfPass),
    highest_qualification_document: qualifications[0]?.document
      ?? optionalValue(payload.attachDocuments ?? payload.highestQualificationDocument),
    qualification_details: qualifications,
    employment_type: optionalValue(payload.employmentType),
    current_employer: optionalValue(payload.currentEmployer),
    current_position: optionalValue(payload.designation ?? payload.position),
    department: optionalValue(payload.department),
    current_working_from: optionalValue(payload.currentWorkingFrom),
    current_ctc: optionalValue(payload.currentCTC ?? payload.currentCtc),
    current_take_home: optionalValue(payload.currentTakeHome),
    role_responsibilities: optionalValue(payload.currentResponsibilities),
    employer_documents: optionalValue(payload.employerDocuments),
    previous_employer_name: previousEmployments[0]?.employer_name
      ?? optionalValue(payload.previousEmployer),
    previous_employer_position: previousEmployments[0]?.position
      ?? optionalValue(payload.previousPosition),
    previous_employer_department: previousEmployments[0]?.department
      ?? optionalValue(payload.previousDepartment),
    previous_working_from: previousEmployments[0]?.working_from ?? null,
    previous_working_to: previousEmployments[0]?.relieved_on ?? null,
    previous_employer_working_period: null,
    previous_employer_ctc: previousEmployments[0]?.ctc
      ?? optionalValue(payload.previousCtc),
    previous_take_home: previousEmployments[0]?.take_home ?? null,
    previous_employer_role: previousEmployments[0]?.responsibilities
      ?? optionalValue(payload.previousResponsibilities),
    previous_employer_documents: previousEmployments[0]?.documents
      ?? optionalValue(payload.previousEmployerDocuments),
    previous_employment_details: previousEmployments
  }
}

export type UserEnquiryRecord = Record<string, unknown> & { id: number }

export const submitUserEnquiry = async (
  payload: UserEnquiryPayload,
  dispatch?: (action: ApiDispatchAction<UserEnquiryRecord>) => void
) => {
  return dispatchRequest(
    'SUBMIT_USER_ENQUIRY',
    () => hrApiClient
      .post<UserEnquiryRecord>('/api/v1/user-enquiries/', normalizeUserEnquiryPayload(payload))
      .then((response) => response.data),
    dispatch
  )
}

export const updateUserEnquiry = async (
  enquiryId: string,
  payload: UserEnquiryPayload
) =>
  hrApiClient
    .put<UserEnquiryRecord>(
      `/api/v1/user-enquiries/${encodeURIComponent(enquiryId)}`,
      normalizeUserEnquiryPayload(payload)
    )
    .then((response) => response.data)

export const getUserEnquiries = async () =>
  hrApiClient
    .get<UserEnquiryRecord[]>('/api/v1/user-enquiries/')
    .then((response) => response.data)

export const uploadUserEnquiryFile = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return hrApiClient
    .post<{ path: string }>('/api/v1/user-enquiries/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    .then((response) => response.data)
}

export type HRFormRecord = {
  id: number
  form_type: string
  payload: Record<string, unknown>
}

export const getHRFormRecords = async (formType: string) =>
  hrApiClient
    .get<HRFormRecord[]>(`/api/v1/hr/forms/${encodeURIComponent(formType)}`)
    .then((response) => response.data)

export const createHRFormRecord = async (
  formType: string,
  payload: Record<string, unknown>
) =>
  hrApiClient
    .post<HRFormRecord>(`/api/v1/hr/forms/${encodeURIComponent(formType)}`, { payload })
    .then((response) => response.data)

export const updateHRFormRecord = async (
  formType: string,
  recordId: string,
  payload: Record<string, unknown>
) =>
  hrApiClient
    .put<HRFormRecord>(
      `/api/v1/hr/forms/${encodeURIComponent(formType)}/${encodeURIComponent(recordId)}`,
      { payload }
    )
    .then((response) => response.data)

export const getHREmployeeByCode = async (employeeCode: string) =>
  hrApiClient
    .get<{
      employee_code?: string
      employee_name: string
      full_name?: string
      name?: string
      designation?: string
      department?: string
    }>(
      `/api/v1/hr/forms/employees/by-code/${encodeURIComponent(employeeCode)}`
    )
    .then((response) => response.data)

export const createAttendanceRecord = async (
  payload: Record<string, string>,
  dispatch?: (action: ApiDispatchAction<unknown>) => void
) =>
  dispatchRequest(
    'CREATE_ATTENDANCE_RECORD',
    () => hrApiClient
      .post('/api/v1/hr/forms/attendance', { payload })
      .then((response) => response.data),
    dispatch
  )

export type LoginCredentials = {
  email: string
  name: string
  password: string
  role: UserRole
}

export const loginUser = async (
  credentials: LoginCredentials,
  dispatch?: (action: ApiDispatchAction<AxiosResponse<UserSession>>) => void
) => {
  return dispatchRequest(
    'LOGIN_USER',
    () => apiClient.post<UserSession>('/api/v1/auth/login', credentials),
    dispatch
  )
}

export const registerUser = async (
  payload: Record<string, unknown>,
  dispatch?: (action: ApiDispatchAction<{ message?: string }>) => void
) => {
  return dispatchRequest(
    'REGISTER_USER',
    () => apiClient
      .post('/api/auth/register', payload)
      .then((response) => response.data),
    dispatch
  )
}
