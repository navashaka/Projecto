import apiClient from './apiClient'

export interface AdminLoginResponse {
  access_token: string
  token_type: 'bearer'
  email: string
  role: 'admin'
  must_change_password: boolean
  expires_in: number
}

export interface AdminIdentity {
  email: string
  role: 'admin'
  must_change_password: boolean
}

export async function loginAdmin(
  email: string,
  password: string,
): Promise<AdminLoginResponse> {
  const response = await apiClient.post<AdminLoginResponse>(
    '/api/v1/auth/login',
    { email, password },
  )
  return response.data
}

export async function getAdminIdentity(): Promise<AdminIdentity> {
  const response = await apiClient.get<AdminIdentity>('/api/v1/auth/me')
  return response.data
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string,
  confirmNewPassword: string,
): Promise<AdminLoginResponse> {
  const response = await apiClient.post<AdminLoginResponse>(
    '/api/v1/auth/change-password',
    {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_new_password: confirmNewPassword,
    },
  )
  return response.data
}

export async function logoutAdmin(): Promise<void> {
  await apiClient.post('/api/v1/auth/logout')
}