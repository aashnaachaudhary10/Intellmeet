import axios from 'axios'

const API = axios.create({
  baseURL: '/api',
  timeout: 10000
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── Auth ──────────────────────────────────────────────
export const signup = (data: { name: string; email: string; password: string }) =>
  API.post('/auth/signup', data)

export const login = (data: { email: string; password: string }) =>
  API.post('/auth/login', data)

export const getMe = () => API.get('/auth/me')
export const logout = () => API.post('/auth/logout')

// ── Meetings ──────────────────────────────────────────
export const getMeetings = () => API.get('/meetings')
export const getMeeting = (id: string) => API.get(`/meetings/${id}`)
export const createMeeting = (data: { title: string; description?: string; scheduledTime?: string }) =>
  API.post('/meetings', data)
export const joinMeetingByCode = (code: string) => API.post(`/meetings/join/${code}`)
export const startMeeting = (id: string) => API.patch(`/meetings/${id}/start`)
export const endMeeting = (id: string) => API.patch(`/meetings/${id}/end`)
export const saveTranscript = (id: string, transcript: string) =>
  API.patch(`/meetings/${id}/transcript`, { transcript })
export const saveSummary = (id: string, data: any) => API.patch(`/meetings/${id}/summary`, data)
export const deleteMeeting = (id: string) => API.delete(`/meetings/${id}`)

// ── Tasks ─────────────────────────────────────────────
export const getTasks = () => API.get('/tasks')
export const createTask = (data: any) => API.post('/tasks', data)
export const updateTaskStatus = (id: string, status: string) =>
  API.patch(`/tasks/${id}/status`, { status })
export const updateTask = (id: string, data: any) => API.put(`/tasks/${id}`, data)
export const deleteTask = (id: string) => API.delete(`/tasks/${id}`)

// ── Users ─────────────────────────────────────────────
export const getUsers = () => API.get('/users')
export const getProfile = () => API.get('/users/profile')
export const updateProfile = (data: any) => API.put('/users/profile', data)

// ── AI ────────────────────────────────────────────────
export const summarizeMeeting = (transcript: string, meetingId?: string) =>
  API.post('/ai/summarize', { transcript, meetingId })
export const getAnalytics = () => API.get('/ai/analytics')

export default API
