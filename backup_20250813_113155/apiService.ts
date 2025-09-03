import axios, { type AxiosInstance } from "axios"
import { authService } from "./authService"

const API_BASE_URL = "http://localhost:8000"

class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
    })

    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem("access_token")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          try {
            const refreshResponse = await authService.refreshToken()
            localStorage.setItem("access_token", refreshResponse.access_token)
            if (refreshResponse.refresh_token) {
              localStorage.setItem("refresh_token", refreshResponse.refresh_token)
            }

            // Retry the original request
            error.config.headers.Authorization = `Bearer ${refreshResponse.access_token}`
            return this.api.request(error.config)
          } catch (refreshError) {
            localStorage.removeItem("access_token")
            localStorage.removeItem("refresh_token")
            window.location.href = "/login"
            return Promise.reject(refreshError)
          }
        }
        return Promise.reject(error)
      },
    )
  }

  // Employee endpoints
  async getEmployees() {
    const response = await this.api.get("/employees/")
    return response.data
  }

  async createEmployee(employeeData: any) {
    const response = await this.api.post("/employees/", employeeData)
    return response.data
  }

  async getEmployee(employeeId: string) {
    const response = await this.api.get(`/employees/${employeeId}`)
    return response.data
  }

  async updateEmployee(employeeId: string, employeeData: any) {
    const response = await this.api.put(`/employees/${employeeId}`, employeeData)
    return response.data
  }

  async deleteEmployee(employeeId: string) {
    await this.api.delete(`/employees/${employeeId}`)
  }

  // Leave endpoints
  async getLeaves() {
    const response = await this.api.get("/v1/leave/")
    return response.data
  }

  async createLeave(leaveData: any) {
    const response = await this.api.post("/v1/leave/", leaveData)
    return response.data
  }

  async updateLeave(leaveId: string, leaveData: any) {
    const response = await this.api.put(`/v1/leave/${leaveId}`, leaveData)
    return response.data
  }

  async deleteLeave(leaveId: string) {
    await this.api.delete(`/v1/leave/${leaveId}`)
  }

  // Attendance endpoints
  async getAttendances() {
    const response = await this.api.get("/v1/attendance/")
    return response.data
  }

  async createAttendance(attendanceData: any) {
    const response = await this.api.post("/v1/attendance/", attendanceData)
    return response.data
  }

  async updateAttendance(attendanceId: string, attendanceData: any) {
    const response = await this.api.put(`/v1/attendance/${attendanceId}`, attendanceData)
    return response.data
  }

  async deleteAttendance(attendanceId: string) {
    await this.api.delete(`/v1/attendance/${attendanceId}`)
  }

  // Payroll endpoints (using employee endpoints as per API spec)
  async createPayroll(payrollData: any) {
    const response = await this.api.post("/employees/payrolls", payrollData)
    return response.data
  }
}

export const apiService = new ApiService()
