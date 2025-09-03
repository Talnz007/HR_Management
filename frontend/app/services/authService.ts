import axios from "axios"

const API_BASE_URL = "http://localhost:8000"; // Standardized base URL

interface LoginResponse {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
}

export const authService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    // Based on your OpenAPI spec, the endpoint expects form data
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    formData.append("grant_type", "password");
    formData.append("scope", "");

    // Convert FormData to URLSearchParams for proper x-www-form-urlencoded format
    const params = new URLSearchParams();
    params.append("username", username);
    params.append("password", password);
    params.append("grant_type", "password");
    params.append("scope", "");

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, params, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      console.log("Login successful:", response.data);
      return response.data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  async refreshToken(): Promise<LoginResponse> {
    const refreshToken = localStorage.getItem("refresh_token")
    if (!refreshToken) {
      throw new Error("No refresh token available")
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh?refresh_token=${refreshToken}`)
      return response.data
    } catch (error) {
      console.error("Token refresh error:", error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem("access_token")
    if (token) {
      try {
        await axios.post(
          `${API_BASE_URL}/auth/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
      } catch (error) {
        console.error("Logout error:", error);
        throw error;
      }
    }
  },

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/password-reset/request-reset`, {
        email,
      });
      return response.data;
    } catch (error) {
      console.error("Password reset request error:", error);
      throw error;
    }
  },

  async register(userData: {
    username: string
    email: string
    phone: string
    password: string
  }) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData)
      return response.data
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },
}