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
import { EventNote, Schedule, Group, Assessment } from "@mui/icons-material"
import { useAuth } from "@/src/contexts/AuthContext"
import { ProtectedRoute } from "../../components/ProtectedRoute"
import Layout from "../../components/Layout"
import { useRouter } from "next/navigation"
import { apiService } from "../../services/apiService"
import toast from "react-hot-toast"

function ManagerDashboard() {
  const { user, isAdmin, isManager } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [managerData, setManagerData] = useState({
    teamMembers: [],
    pendingLeaves: [],
    recentAttendance: [],
    departmentStats: {},
  })

  useEffect(() => {
    if (!isManager && !isAdmin) {
      router.push("/dashboard")
      return
    }

    const fetchManagerData = async () => {
      setLoading(true)
      try {
        // Fetch data for manager dashboard
        const [teamMembers, pendingLeaves, recentAttendance, departmentStats] = await Promise.all([
          apiService.getTeamMembers(),
          apiService.getPendingLeaves(),
          apiService.getTeamAttendance(),
          apiService.getDepartmentStats()
        ])

        setManagerData({
          teamMembers: teamMembers || [],
          pendingLeaves: pendingLeaves || [],
          recentAttendance: recentAttendance || [],
          departmentStats: departmentStats || {},
        })
      } catch (error) {
        console.error("Error fetching manager dashboard data:", error)
        toast.error("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchManagerData()
  }, [isManager, isAdmin, router])

  const getStatusColor = (status: string) => {
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

  const handleApproveLeave = async (leaveId: string) => {
    try {
      await apiService.approveLeave(leaveId);
      toast.success("Leave request approved");
      // Refresh pending leaves
      const pendingLeaves = await apiService.getPendingLeaves();
      setManagerData(prev => ({
        ...prev,
        pendingLeaves: pendingLeaves || []
      }));
    } catch (error) {
      console.error("Error approving leave:", error);
      toast.error("Failed to approve leave request");
    }
  };

  const handleRejectLeave = async (leaveId: string) => {
    try {
      await apiService.rejectLeave(leaveId);
      toast.success("Leave request rejected");
      // Refresh pending leaves
      const pendingLeaves = await apiService.getPendingLeaves();
      setManagerData(prev => ({
        ...prev,
        pendingLeaves: pendingLeaves || []
      }));
    } catch (error) {
      console.error("Error rejecting leave:", error);
      toast.error("Failed to reject leave request");
    }
  };

  if (!isManager && !isAdmin) {
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
      <Typography variant="h4" gutterBottom>
        Manager Dashboard - Welcome, {user?.username}!
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Team Members
                  </Typography>
                  <Typography variant="h4">{managerData.teamMembers.length}</Typography>
                </Box>
                <Box sx={{ color: "#1976d2" }}>
                  <Group fontSize="large" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Pending Approvals
                  </Typography>
                  <Typography variant="h4">{managerData.pendingLeaves.length}</Typography>
                </Box>
                <Box sx={{ color: "#ed6c02" }}>
                  <EventNote fontSize="large" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Today's Attendance
                  </Typography>
                  <Typography variant="h4">{managerData.recentAttendance.length}</Typography>
                </Box>
                <Box sx={{ color: "#2e7d32" }}>
                  <Schedule fontSize="large" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Department
                  </Typography>
                  <Typography variant="h6">{managerData.departmentStats.name || "N/A"}</Typography>
                </Box>
                <Box sx={{ color: "#9c27b0" }}>
                  <Assessment fontSize="large" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Pending Leave Approvals
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Dates</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {managerData.pendingLeaves.length > 0 ? (
                    managerData.pendingLeaves.map((leave: any) => (
                      <TableRow key={leave.leave_id}>
                        <TableCell>{leave.employee_id}</TableCell>
                        <TableCell>{leave.leave_type}</TableCell>
                        <TableCell>
                          {new Date(leave.start_date).toLocaleDateString()} -{" "}
                          {new Date(leave.end_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => handleApproveLeave(leave.leave_id)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              color="error"
                              onClick={() => handleRejectLeave(leave.leave_id)}
                            >
                              Reject
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">No pending leave requests</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Team Members
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Job Title</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {managerData.teamMembers.length > 0 ? (
                    managerData.teamMembers.map((member: any) => (
                      <TableRow key={member.employee_id}>
                        <TableCell>{`${member.first_name} ${member.last_name}`}</TableCell>
                        <TableCell>{member.job_title}</TableCell>
                        <TableCell>
                          <Chip
                            label={member.status}
                            color={member.status === "active" ? "success" : "error"}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">No team members found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Today's Team Attendance
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Clock In</TableCell>
                    <TableCell>Clock Out</TableCell>
                    <TableCell>Hours</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {managerData.recentAttendance.length > 0 ? (
                    managerData.recentAttendance.map((attendance: any) => (
                      <TableRow key={attendance.attendance_id}>
                        <TableCell>{attendance.user_id}</TableCell>
                        <TableCell>{attendance.clock_in || "N/A"}</TableCell>
                        <TableCell>{attendance.clock_out || "N/A"}</TableCell>
                        <TableCell>{attendance.total_hours || "N/A"}</TableCell>
                        <TableCell>
                          <Chip
                            label={attendance.attendance_type}
                            color={
                              attendance.attendance_type === "present" ? "success" :
                              attendance.attendance_type === "late" ? "warning" : "error"
                            }
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">No attendance records found for today</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default function ManagerDashboardPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <ManagerDashboard />
      </Layout>
    </ProtectedRoute>
  )
}