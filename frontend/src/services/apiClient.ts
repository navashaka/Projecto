import axios from 'axios'
import { API_BASE_URL } from '../config/env'
import { useAppStore } from '../store/appStore'

const apiClient = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		'Content-Type': 'application/json',
	},
})

apiClient.interceptors.request.use((config) => {
	const token = useAppStore.getState().session?.accessToken
	if (token) {
		config.headers.Authorization = `Bearer ${token}`
	} else {
		delete config.headers.Authorization
	}
	return config
})

apiClient.interceptors.response.use(
	(response) => response,
	(error: unknown) => {
		if (
			typeof error === 'object'
			&& error !== null
			&& 'response' in error
			&& typeof error.response === 'object'
			&& error.response !== null
			&& 'status' in error.response
			&& error.response.status === 401
			&& useAppStore.getState().session?.accessToken
		) {
			useAppStore.getState().logout()
		}
		return Promise.reject(error)
	},
)

export default apiClient
