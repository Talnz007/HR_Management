import axios from "axios"

const API_BASE_URL = "http://localhost:8000" // Standardized base URL

interface LoginResponse {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
}

interface User {
  user_id: string
  username: string
  email: string
  phone: string
  is_active: boolean
  is_admin?: boolean
}

export const authService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const formData = new FormData()
    formData.append("username", username)
    formData.append("password", password)
    formData.append("grant_type", "password")
    formData.append("scope", "")

    const response = await axios.post(`${API_BASE_URL}/auth/login`, formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
    return response.data
  },


  async refreshToken(): Promise<LoginResponse> {
    const refreshToken = localStorage.getItem("refresh_token")
    if (!refreshToken) {
      throw new Error("No refresh token available")
    }

    const response = await axios.post(`${API_BASE_URL}/auth/refresh?refresh_token=${refreshToken}`)
    return response.data
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem("access_token")
    if (token) {
      await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
    }
  },

  async getCurrentUser(): Promise<User> {
    // Since there's no direct endpoint for current user, we'll simulate it
    // In a real app, you might decode the JWT or have a /me endpoint
    const token = localStorage.getItem("access_token")
    if (!token) {
      throw new Error("No token available")
    }

    // For demo purposes, we'll return a mock user
    // In production, you'd decode the JWT or call a /me endpoint
    return {
      user_id: "123e4567-e89b-12d3-a456-426614174000",
      username: "admin",
      email: "admin@company.com",
      phone: "+1234567890",
      is_active: true,
      is_admin: true, // This would come from JWT or API
    }
  },

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const response = await axios.post(`${API_BASE_URL}/api/v1/password-reset/request-reset`, {
      email,
    });
    return response.data;
  },

  async register(userData: {
    username: string
    email: string
    phone: string
    password: string
  }): Promise<User> {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, userData)
    return response.data
  },
}
