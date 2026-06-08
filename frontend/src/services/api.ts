import axios from 'axios'
import { useAuthStore } from '../store/authStore'

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// Request interceptor — attach access token
API.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// Response interceptor — transparent token refresh on 401
API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config

    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/signup') ||
      originalRequest.url?.includes('/auth/logout')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true
      try {
        const refreshToken = useAuthStore.getState().refreshToken
        if (!refreshToken) throw new Error('No refresh token available')

        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { timeout: 10000 }
        )
        const { accessToken: newAccessToken } = response.data.data
        useAuthStore.getState().setAccessToken(newAccessToken)
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return API(originalRequest)
      } catch (refreshError) {
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// ── Auth ──────────────────────────────────────────────────────────
export const signup = (data: { name: string; email: string; password: string }) =>
  API.post('/auth/signup', data)

export const login = (data: { email: string; password: string }) =>
  API.post('/auth/login', data)

export const refreshAccessToken = (refreshToken: string) =>
  API.post('/auth/refresh', { refreshToken })

export const logout = (refreshToken?: string) =>
  API.post('/auth/logout', { refreshToken })

export const getMe = () => API.get('/auth/me')

// ── Meetings ──────────────────────────────────────────────────────
export const getMeetings = () => API.get('/meetings/dashboard')
export const getMeeting = (id: string) => API.get(`/meetings/${id}`)
export const createMeeting = (data: { title: string; description?: string; scheduledTime?: string }) =>
  API.post('/meetings/create', data)
export const joinMeetingByCode = (data: { meetingCode: string; userName: string }) =>
  API.post('/meetings/join', data)
export const startMeeting = (id: string) => API.patch(`/meetings/${id}/start`)
export const endMeeting = (id: string) => API.patch(`/meetings/${id}/end`)
// New: participant leaves without ending the meeting
export const leaveMeeting = (id: string) => API.patch(`/meetings/${id}/leave`)
export const saveTranscript = (id: string, transcript: string) =>
  API.patch(`/meetings/${id}/transcript`, { transcript })
export const saveRecordingPart = (id: string, data: any) =>
  API.patch(`/meetings/${id}/recording-part`, data)
export const saveSummary = (id: string, data: any) =>
  API.patch(`/meetings/${id}/summary`, data)
export const deleteMeeting = (id: string) => API.delete(`/meetings/delete/${id}`)

// ── Tasks ─────────────────────────────────────────────────────────
export const getTasks = () => API.get('/tasks').then((r) => r.data.tasks)
export const createTask = (data: any) => API.post('/tasks', data)
export const updateTaskStatus = (id: string, status: string) =>
  API.patch(`/tasks/${id}/status`, { status })
export const updateTask = (id: string, data: any) => API.put(`/tasks/${id}`, data)
export const deleteTask = (id: string) => API.delete(`/tasks/${id}`)

// ── Users ─────────────────────────────────────────────────────────
export const getUsers = () => API.get('/users')
export const getProfile = () => API.get('/users/profile')
export const updateProfile = (data: FormData | any) => API.put('/auth/update', data)

// ── AI ────────────────────────────────────────────────────────────
export const summarizeMeeting = (transcript: string, meetingId?: string) =>
  API.post('/ai/summarize', { transcript, meetingId })
export const getAnalytics = () => API.get('/ai/analytics')

// ── Docs / file management ─────────────────────────────────────────
export const DOCS_ROOT_PATH =
  import.meta.env.VITE_DOCS_ROOT || 'D:/Projects/aa/Intellmeet'

export type FileListItem = {
  name: string
  type: 'folder' | 'file'
  size: number | null
}

export const getProjectDocs = () =>
  API.get<{ success: boolean; currentPath: string; files: FileListItem[] }>('/files', {
    params: { path: DOCS_ROOT_PATH },
  })

export const getDocContent = (filePath: string) =>
  API.get<string>('/files/stream', {
    params: { path: filePath },
    responseType: 'text',
  })

export default API
