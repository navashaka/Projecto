import axios from 'axios'

const configuredApiUrl = import.meta.env.VITE_API_URL
  ?? import.meta.env.VITE_API_BASE_URL
  ?? 'http://localhost:8000'
const baseURL =
  import.meta.env.DEV ||
  (typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    configuredApiUrl.startsWith('http:'))
    ? ''
    : configuredApiUrl

const profileApi = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' }
})

export type ProfileRecord = Record<string, string | number | null> & {
  id: number
}

export type ProfileLookupOption = {
  value: string
  label: string
}

const unwrapError = (error: unknown): Error => {
  if (axios.isAxiosError<{ detail?: string | Array<{ msg?: string }> }>(error)) {
    const detail = error.response?.data?.detail
    const message = Array.isArray(detail)
      ? detail.map((issue) => issue.msg).filter(Boolean).join('; ')
      : detail
    return new Error(
      typeof message === 'string' && message
        ? message
        : error.message || 'Profile API request failed.'
    )
  }
  return error instanceof Error ? error : new Error('Profile API request failed.')
}

const request = async <T,>(operation: () => Promise<T>): Promise<T> => {
  try {
    return await operation()
  } catch (error) {
    throw unwrapError(error)
  }
}

export const getProfiles = () =>
  request(() =>
    profileApi.get<ProfileRecord[]>('/api/v1/profile/')
      .then((response) => response.data)
  )

export const getProfileLookups = (lookup: string) =>
  request(() =>
    profileApi.get<ProfileLookupOption[]>(
      `/api/v1/profile/lookups/${encodeURIComponent(lookup)}`
    ).then((response) => response.data)
  )

export const createProfile = (payload: Record<string, string | null>) =>
  request(() =>
    profileApi.post<ProfileRecord>('/api/v1/profile/', payload)
      .then((response) => response.data)
  )

export const updateProfile = (
  profileId: string,
  payload: Record<string, string | null>
) =>
  request(() =>
    profileApi.put<ProfileRecord>(
      `/api/v1/profile/${encodeURIComponent(profileId)}`,
      payload
    ).then((response) => response.data)
  )

export const deleteProfile = (profileId: string) =>
  request(() =>
    profileApi.delete(`/api/v1/profile/${encodeURIComponent(profileId)}`)
  )
