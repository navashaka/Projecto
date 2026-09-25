import axios from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
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
): Promise<T> => {
  try {
    const payload = await request()

    dispatch?.({
      type,
      payload
    })

    return payload
  } catch (error) {
    dispatch?.({
      type: `${type}_FAILED`,
      error
    })

    throw error
  }
}

export type PreviousEmploymentPayload = {
  previousEmployer: string
  previousPosition: string
  previousDepartment: string
  previousWorkingPeriod: string
  previousCtc: string
  previousResponsibilities: string
}

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

  previousEmployments?: PreviousEmploymentPayload[]

  [key: string]:
    | string
    | PreviousEmploymentPayload[]
    | undefined
}

export const normalizeUserEnquiryPayload = (
  payload: UserEnquiryPayload
) => ({
  candidate_name: payload.candidateName,
  father_name: payload.fatherName,
  date_of_birth: payload.dob,
  blood_group: payload.bloodGroup,
  marital_status: payload.maritalStatus,
  religion: payload.religion,
  nationality: payload.nationality,
  mother_tongue: payload.motherTongue,
  other_languages_known: payload.languagesKnown,
  address: payload.address,
  phone: payload.phone,
  personal_email: payload.personalEmail,
  pan: payload.pan,
  aadhaar: payload.aadhar,
  passport_no: payload.passportNo,
  emergency_phone_1: payload.emergencyPhone1,
  emergency_phone_2: payload.emergencyPhone2,

  highest_qualification: payload.highestQualification,
  year_of_pass: payload.yearOfPass,

  current_employer: payload.currentEmployer,
  current_position: payload.position,
  department: payload.department,
  working_period: payload.workingPeriod,
  current_ctc: payload.currentCtc,
  role_responsibilities: payload.currentResponsibilities,

  previous_employer_name:
    payload.previousEmployer,

  previous_employer_position:
    payload.previousPosition,

  previous_employer_department:
    payload.previousDepartment,

  previous_employer_working_period:
    payload.previousWorkingPeriod,

  previous_employer_ctc:
    payload.previousCtc,

  previous_employer_role:
    payload.previousResponsibilities,

  previous_employments:
    payload.previousEmployments?.map(
      (employment) => ({
        employer:
          employment.previousEmployer,

        position:
          employment.previousPosition,

        department:
          employment.previousDepartment,

        working_period:
          employment.previousWorkingPeriod,

        ctc:
          employment.previousCtc,

        responsibilities:
          employment.previousResponsibilities,

        documents: null
      })
    ) ?? []
})

export const submitUserEnquiry = async (
  payload: UserEnquiryPayload,
  dispatch?: (
    action: ApiDispatchAction<{
      message?: string
    }>
  ) => void
) => {
  return dispatchRequest(
    'SUBMIT_USER_ENQUIRY',
    async () => {
      const normalizedPayload =
        normalizeUserEnquiryPayload(payload)

      const response = await apiClient.post(
        '/api/v1/user-enquiries/',
        normalizedPayload
      )

      return response.data
    },
    dispatch
  )
}

export const loginUser = async (
  email: string,
  password: string,
  dispatch?: (
    action: ApiDispatchAction<{
      token?: string
    }>
  ) => void
) => {
  return dispatchRequest(
    'LOGIN_USER',
    async () => {
      const response = await apiClient.post(
        '/api/auth/login',
        {
          email,
          password
        }
      )

      return response.data
    },
    dispatch
  )
}

export const registerUser = async (
  payload: Record<string, unknown>,
  dispatch?: (
    action: ApiDispatchAction<{
      message?: string
    }>
  ) => void
) => {
  return dispatchRequest(
    'REGISTER_USER',
    async () => {
      const response = await apiClient.post(
        '/api/auth/register',
        payload
      )

      return response.data
    },
    dispatch
  )
}