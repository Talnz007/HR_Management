"use client"

import { useState, useEffect } from "react"
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Button,
} from "@mui/material"
import { EventNote, Schedule, Payment, Person } from "@mui/icons-material"
import { useAuth } from "@/src/contexts/AuthContext"
import { ProtectedRoute } from "../components/ProtectedRoute"
import Layout from "../components/Layout"
import { useRouter } from "next/navigation"
import { apiService } from "../services/apiService"
import toast from "react-hot-toast"

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <EmployeeDashboard />
      </Layout>
    </ProtectedRoute>
  )
}

function EmployeeDashboard() {
  const { user, isAdmin, isManager } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [employeeData, setEmployeeData] = useState({
    leaves: [],
    attendances: [],
    payrolls: [],
    todayAttendance: null
  })

  useEffect(() => {
    if (isAdmin) {
      router.push("/admin/dashboard")
      return
    }

    if (isManager) {
      router.push("/manager/dashboard")
      return
    }

    const fetchEmployeeData = async () => {
      setLoading(true)
      try {
        const [leavesData, attendancesData, payrollsData, todayAttendance] = await Promise.all([
          apiService.getMyLeaves(),
          apiService.getMyAttendances(),
          apiService.getMyPayrolls(),
          apiService.getTodayAttendance()
        ])

        setEmployeeData({
          leaves: leavesData || [],
          attendances: attendancesData || [],
          payrolls: payrollsData || [],
          todayAttendance: todayAttendance?.attendance_id ? todayAttendance : null
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast.error("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchEmployeeData()
  }, [isAdmin, isManager, router])

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "success"
      case "pending":
        return "warning"
      case "rejected":
        return "error"
      default:
        return "default"
    }
  }

  const handleClockIn = async () => {
    try {
      const response = await apiService.startAttendance();
      toast.success("You have clocked in successfully");
      // Update today's attendance
      setEmployeeData(prev => ({
        ...prev,
        todayAttendance: response
      }));
    } catch (error) {
      console.error("Error clocking in:", error);
      toast.error("Failed to clock in");
    }
  };

  const handleClockOut = async () => {
    try {
      const response = await apiService.stopAttendance();
      toast.success("You have clocked out successfully");
      // Update today's attendance
      setEmployeeData(prev => ({
        ...prev,
        todayAttendance: response
      }));
    } catch (error) {
      console.error("Error clocking out:", error);
      toast.error("Failed to clock out");
    }
  };

  // Format hours properly
  const formatHours = (hours) => {
    if (!hours) return "N/A";
    return parseFloat(hours).toFixed(2);
  };

  if (isAdmin || isManager) {
    return null // Will redirect in useEffect
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Welcome, {user?.username}!
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography color="textSecondary" gutterBottom>
                My Leaves
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, justifyContent: 'space-between' }}>
                <Typography variant="h4">{employeeData.leaves.length}</Typography>
                <EventNote fontSize="large" sx={{ color: "#ed6c02" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography color="textSecondary" gutterBottom>
                Attendance Records
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, justifyContent: 'space-between' }}>
                <Typography variant="h4">{employeeData.attendances.length}</Typography>
                <Schedule fontSize="large" sx={{ color: "#2e7d32" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography color="textSecondary" gutterBottom>
                Latest Payroll
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, justifyContent: 'space-between' }}>
                <Typography variant="h4">
                  ${employeeData.payrolls.length > 0 ? employeeData.payrolls[0]?.net_pay || 0 : 0}
                </Typography>
                <Payment fontSize="large" sx={{ color: "#9c27b0" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography color="textSecondary" gutterBottom>
                Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, justifyContent: 'space-between' }}>
                <Typography variant="h6">{user?.is_active ? "Active" : "Inactive"}</Typography>
                <Person fontSize="large" sx={{ color: "#1976d2" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Today's Attendance Card */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Today's Attendance
        </Typography>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={8}>
            <Box>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Clock In:</strong> {employeeData.todayAttendance?.clock_in || "Not clocked in"}
              </Typography>
              <Typography variant="body1">
                <strong>Clock Out:</strong> {employeeData.todayAttendance?.clock_out || "Not clocked out"}
              </Typography>

              {employeeData.todayAttendance?.total_hours && (
                <Typography variant="body1" sx={{ mt: 1 }}>
                  <strong>Total Hours:</strong> {formatHours(employeeData.todayAttendance.total_hours)}
                </Typography>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
            {!employeeData.todayAttendance ? (
              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                onClick={handleClockIn}
              >
                Clock In
              </Button>
            ) : !employeeData.todayAttendance.clock_out ? (
              <Button
                variant="contained"
                color="error"
                size="large"
                fullWidth
                onClick={handleClockOut}
              >
                Clock Out
              </Button>
            ) : (
              <Chip
                label="Day Completed"
                color="success"
                sx={{ fontSize: '1rem', p: 1 }}
              />
            )}
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Leave Requests
            </Typography>
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Dates</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employeeData.leaves.length > 0 ? (
                    employeeData.leaves.slice(0, 5).map((leave) => (
                      <TableRow key={leave.leave_id}>
                        <TableCell>
                          {leave.leave_type.charAt(0).toUpperCase() + leave.leave_type.slice(1)}
                        </TableCell>
                        <TableCell>
                          {new Date(leave.start_date).toLocaleDateString()} -{" "}
                          {new Date(leave.end_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={leave.status}
                            color={getStatusColor(leave.status)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">No leave requests found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {employeeData.leaves.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  href="/leaves"
                >
                  View All
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Attendance
            </Typography>
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Clock In</TableCell>
                    <TableCell>Clock Out</TableCell>
                    <TableCell>Hours</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employeeData.attendances.length > 0 ? (
                    employeeData.attendances.slice(0, 5).map((attendance) => (
                      <TableRow key={attendance.attendance_id}>
                        <TableCell>
                          {new Date(attendance.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{attendance.clock_in || "N/A"}</TableCell>
                        <TableCell>{attendance.clock_out || "N/A"}</TableCell>
                        <TableCell>{formatHours(attendance.total_hours)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">No attendance records found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {employeeData.attendances.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  href="/attendance"
                >
                  View All
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}