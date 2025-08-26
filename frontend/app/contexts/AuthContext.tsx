"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { authService } from "../services/authService"
import { apiService } from "@/app/services/apiService"

interface User {
  user_id: string
  username: string
  email: string
  phone: string
  is_active: boolean
  is_admin?: boolean
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
  const initAuth = async () => {
    const token = localStorage.getItem("access_token")
    if (token) {
      try {
        const userData = await apiService.getMe() // real API
        setUser(userData)
      } catch {
        localStorage.clear()
      }
    }
    setLoading(false)
  }
  initAuth()
}, [])

  const login = async (username: string, password: string) => {
    const response = await authService.login(username, password)
    localStorage.setItem("access_token", response.access_token)
    if (response.refresh_token) {
      localStorage.setItem("refresh_token", response.refresh_token)
    }

    // Get user info after login
    const userData = await authService.getCurrentUser()
    setUser(userData)
  }

  const logout = async () => {
    try {
      if (user?.is_admin) {
        await authService.logout()
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      setUser(null)
    }
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.is_admin || false,
    login,
    logout,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
