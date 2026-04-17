import { create } from 'zustand'

interface User {
  id: string
  name: string
  email: string
  avatar: string
  role: string
}

interface AuthStore {
  user: User | null
  token: string | null
  isLoading: boolean
  setUser: (user: User, token: string) => void
  setLoading: (v: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  setUser: (user, token) => {
    localStorage.setItem('token', token)
    set({ user, token })
  },
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  }
}))
