import { create } from 'zustand'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role?: string
}

interface AuthStore {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  initialized: boolean
  isAuthenticated: boolean
  setUser: (user: User, accessToken: string, refreshToken: string) => void
  setAccessToken: (token: string) => void
  setLoading: (v: boolean) => void
  logout: () => void
  clearAuth: () => void
  initializeFromStorage: () => void
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  initialized: false,
  isAuthenticated: false,

  setUser: (user: User, accessToken: string, refreshToken: string) => {
    const normalizedUser: User = {
      id: user.id || '',
      name: user.name || 'User',
      email: user.email || '',
      avatar: user.avatar || '',
      role: user.role || 'member',
    }
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(normalizedUser))
    set({
      user: normalizedUser,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
      initialized: true,
    })
  },

  setAccessToken: (token) => {
    localStorage.setItem('accessToken', token)
    set({ accessToken: token, initialized: true })
  },

  setLoading: (isLoading) => set({ isLoading }),

  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      initialized: true,
    })
  },

  clearAuth: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      initialized: true,
    })
  },

  initializeFromStorage: () => {
    try {
      const accessToken = localStorage.getItem('accessToken')
      const refreshToken = localStorage.getItem('refreshToken')
      const userStr = localStorage.getItem('user')

      if (accessToken && refreshToken && userStr) {
        const user = JSON.parse(userStr)
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
          initialized: true,
        })
      } else {
        set({ initialized: true, isLoading: false })
      }
    } catch (error) {
      console.error('Failed to initialize auth from storage:', error)
      get().clearAuth()
    }
  },
}))
