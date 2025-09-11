import axios, { type AxiosInstance } from "axios"
import { authService } from "./authService"

const API_BASE_URL = "http://localhost:8000"

interface Employee {
  employee_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  job_title?: string;
  manager_id?: string;
  department_id?: string;
  status: string;
}

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

  // Admin endpoints
  async getDashboardStats() {
    try {
      const response = await this.api.get("/api/v1/admin/dashboard-stats");
      // The backend returns snake_case, so we map it to camelCase for the frontend
      return {
        totalEmployees: response.data.total_employees,
        pendingLeaves: response.data.pending_leaves,
        todayAttendance: response.data.today_attendance,
        monthlyPayroll: response.data.monthly_payroll,
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  }

  // User endpoints
  async getMe() {
    try {
      const response = await this.api.get("/users/me");
      return response.data;
    } catch (error) {
      console.error("Error fetching current user:", error);
      throw error;
    }
  }

  async getMyProfile() {
    try {
      const response = await this.api.get("/users/me/profile");
      return response.data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  }

  async uploadProfilePicture(userId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return (await this.api.post(`/users/${userId}/profile-picture`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })).data;
  }

  async deleteProfilePicture(userId: string) {
    return (await this.api.delete(`/users/${userId}/profile-picture`)).data;
  }

  // Employee endpoints
  async getEmployees() {
    try {
      const response = await this.api.get("/employees/");
      return response.data;
    } catch (error) {
      console.error("Error fetching employees:", error);
      return [];
    }
  }

  async createEmployee(employeeData: any) {
    const response = await this.api.post("/employees/", employeeData);
    return response.data;
  }

  async getEmployee(employeeId: string) {
    const response = await this.api.get(`/employees/${employeeId}`);
    return response.data;
  }

  async updateEmployee(employeeId: string, employeeData: any) {
    const response = await this.api.put(`/employees/${employeeId}`, employeeData);
    return response.data;
  }

  async deleteEmployee(employeeId: string) {
    await this.api.delete(`/employees/${employeeId}`);
  }

  // Department endpoints
  async getDepartments() {
  try {
    const response = await this.api.get("/departments/");

    // Format the response to ensure it has manager_name for display
    const enhancedDepartments = response.data.map((dept: any) => ({
      ...dept,
      manager_name: dept.manager ? `${dept.manager.first_name} ${dept.manager.last_name}` : "None"
    }));

    return enhancedDepartments;
  } catch (error) {
    console.error("Error fetching departments:", error);
    return [];
  }
}

  // Attendance endpoints
  async getAttendances() {
    try {
      const response = await this.api.get("/v1/attendance/");
      return response.data;
    } catch (error) {
      console.error("Error fetching all attendances:", error);
      return [];
    }
  }

  async getMyAttendances() {
    try {
      const response = await this.api.get("/v1/attendance/self/history");
      return response.data;
    } catch (error) {
      console.error("Error fetching user attendance history:", error);
      return [];
    }
  }

  async getTodayAttendance() {
    try {
      const response = await this.api.get("/v1/attendance/self");
      return response.data;
    } catch (error) {
      console.error("Error fetching today's attendance:", error);
      return null;
    }
  }

  async startAttendance() {
    try {
      const response = await this.api.post("/v1/attendance/self/start");
      return response.data;
    } catch (error) {
      console.error("Error starting attendance:", error);
      throw error;
    }
  }

  async stopAttendance() {
    try {
      const response = await this.api.post("/v1/attendance/self/stop");
      return response.data;
    } catch (error) {
      console.error("Error stopping attendance:", error);
      throw error;
    }
  }

  async pauseAttendance() {
    try {
      const response = await this.api.post("/v1/attendance/self/pause");
      return response.data;
    } catch (error) {
      console.error("Error pausing attendance:", error);
      throw error;
    }
  }

  async createAttendance(attendanceData: any) {
    const response = await this.api.post("/v1/attendance/", attendanceData);
    return response.data;
  }

  async updateAttendance(attendanceId: string, attendanceData: any) {
    const response = await this.api.put(`/v1/attendance/${attendanceId}`, attendanceData);
    return response.data;
  }

  async deleteAttendance(attendanceId: string) {
    await this.api.delete(`/v1/attendance/${attendanceId}`);
  }

  // Leave endpoints
  async getLeaves() {
    try {
      const response = await this.api.get("/v1/leave/");
      return response.data;
    } catch (error) {
      console.error("Error fetching all leaves:", error);
      return [];
    }
  }

  async getMyLeaves() {
    try {
      const response = await this.api.get("/v1/leave/self");
      return response.data;
    } catch (error) {
      console.error("Error fetching user leaves:", error);
      return [];
    }
  }

  async createLeave(leaveData: any) {
    try {
      const response = await this.api.post("/v1/leave/", leaveData);
      return response.data;
    } catch (error) {
      console.error("Error creating leave:", error);
      throw error;
    }
  }

  async createLeaveSelf(leaveData: any) {
    try {
      const response = await this.api.post("/v1/leave/self", leaveData);
      return response.data;
    } catch (error) {
      console.error("Error creating self leave:", error);
      throw error;
    }
  }

  async updateLeave(leaveId: string, leaveData: any) {
    try {
      const response = await this.api.put(`/v1/leave/${leaveId}`, leaveData);
      return response.data;
    } catch (error) {
      console.error("Error updating leave:", error);
      throw error;
    }
  }

  async deleteLeave(leaveId: string) {
    try {
      await this.api.delete(`/v1/leave/${leaveId}`);
    } catch (error) {
      console.error("Error deleting leave:", error);
      throw error;
    }
  }

  // Payroll endpoints
  async getPayrolls() {
    try {
      const response = await this.api.get("/v1/payroll/");
      return response.data;
    } catch (error) {
      console.error("Error fetching all payrolls:", error);
      return [];
    }
  }

  async getMyPayrolls() {
    try {
      const response = await this.api.get("/v1/payroll/me");
      return response.data;
    } catch (error) {
      console.error("Error fetching user payrolls:", error);
      return [];
    }
  }

  async createPayroll(payrollData: any) {
    try {
      const response = await this.api.post("/v1/payroll/", payrollData);
      return response.data;
    } catch (error) {
      console.error("Error creating payroll:", error);
      throw error;
    }
  }

  async updatePayroll(payrollId: string, payrollData: any) {
    try {
      const response = await this.api.put(`/v1/payroll/${payrollId}`, payrollData);
      return response.data;
    } catch (error) {
      console.error("Error updating payroll:", error);
      throw error;
    }
  }

  async deletePayroll(payrollId: string) {
    try {
      await this.api.delete(`/v1/payroll/${payrollId}`);
    } catch (error) {
      console.error("Error deleting payroll:", error);
      throw error;
    }
  }

  // Add these methods to your existing apiService class

async updateEmployeeRole(employeeId: string, role: string) {
  try {
    const response = await this.api.put(`/api/v1/employees/${employeeId}/role`, { role });
    return response.data;
  } catch (error) {
    console.error("Error updating employee role:", error);
    throw error;
  }
}

async createDepartment(departmentData: { name: string, manager_id: string | null }) {
  try {
    const response = await this.api.post('/departments/', departmentData);
    return response.data;
  } catch (error) {
    console.error("Error creating department:", error);
    throw error;
  }
}

async updateDepartment(departmentId: string, departmentData: { name: string, manager_id: string | null }) {
  try {
    const response = await this.api.put(`/departments/${departmentId}`, departmentData);
    return response.data;
  } catch (error) {
    console.error("Error updating department:", error);
    throw error;
  }
}

async deleteDepartment(departmentId: string) {
  try {
    await this.api.delete(`/departments/${departmentId}`);
    return true;
  } catch (error) {
    console.error("Error deleting department:", error);
    throw error;
  }
}

  // Manager-specific endpoints (to be implemented on backend)
  // Add to your ApiService class
async getUserRole() {
  try {
    // First get the user data
    const userData = await this.getMe();

    // Then check if the user is an admin
    if (userData.role === "admin") {
      return "admin";
    }

    // If not admin, check if they're a manager by getting their employee profile
    const employeeData = await this.getMyProfile();

    // Check if they have any subordinates (they're a manager)
    const teamMembers = await this.getTeamMembers(employeeData.employee_id);

    if (teamMembers && teamMembers.length > 0) {
      return "manager";
    }

    // Default to employee
    return "employee";
  } catch (error) {
    console.error("Error determining user role:", error);
    return "employee"; // Default
  }
}

async getTeamMembers(managerId: string | null = null): Promise<Employee[]> {
  try {
    // Instead of client-side filtering, use the existing employees endpoint
    // The backend already has department access control implemented
    const employees = await this.getEmployees();

    // The backend's filter_employees_by_department_access will
    // automatically filter based on the user's department management role
    return employees;
  } catch (error) {
    console.error("Error fetching team members:", error);
    return [];
  }
}

  async getPendingLeaves() {
    try {
      // This would need to be implemented on your backend
      // For now, we'll get all leaves and filter for pending status
      const leaves = await this.getLeaves();
      return leaves.filter((leave: any) => leave.status === 'pending');
    } catch (error) {
      console.error("Error fetching pending leaves:", error);
      return [];
    }
  }

  async getTeamAttendance() {
    try {
      // This would need to be implemented on your backend
      // For now, we'll get all attendance records for today
      const today = new Date().toISOString().split('T')[0];
      const attendances = await this.getAttendances();
      return attendances.filter((attendance: any) =>
        attendance.date === today
      );
    } catch (error) {
      console.error("Error fetching team attendance:", error);
      return [];
    }
  }

  async getDepartmentStats() {
    try {
      // This would need to be implemented on your backend
      // For now, we'll return a placeholder
      const profile = await this.getMyProfile();
      const departments = await this.getDepartments();
      const department = departments.find((d: any) => d.department_id === profile.department_id);

      return {
        name: department?.name || "Unknown Department",
        employee_count: 0,
        // Other stats would come from the backend
      };
    } catch (error) {
      console.error("Error fetching department stats:", error);
      return {};
    }
  }

  async approveLeave(leaveId: string) {
    try {
      return await this.updateLeave(leaveId, { status: 'approved' });
    } catch (error) {
      console.error("Error approving leave:", error);
      throw error;
    }
  }


  async rejectLeave(leaveId: string) {
    try {
      return await this.updateLeave(leaveId, { status: 'rejected' });
    } catch (error) {
      console.error("Error rejecting leave:", error);
      throw error;
    }
  }
}

export const apiService = new ApiService()