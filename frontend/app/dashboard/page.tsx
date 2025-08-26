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
} from "@mui/material"
import { EventNote, Schedule, Payment, Person } from "@mui/icons-material"
import { useAuth } from "../contexts/AuthContext"
import { ProtectedRoute } from "../components/ProtectedRoute"
import Layout from "../components/Layout"
import { useRouter } from "next/navigation"

function EmployeeDashboard() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [employeeData, setEmployeeData] = useState({
    leaves: [],
    attendances: [],
    payrolls: [],
  })

  useEffect(() => {
    if (isAdmin) {
      router.push("/admin/dashboard")
      return
    }

    // In a real app, you'd fetch employee-specific data here
    // For demo purposes, we'll use mock data
    setEmployeeData({
      leaves: [
        {
          id: "1",
          type: "vacation",
          startDate: "2024-01-15",
          endDate: "2024-01-17",
          status: "approved",
        },
        {
          id: "2",
          type: "sick",
          startDate: "2024-01-20",
          endDate: "2024-01-20",
          status: "pending",
        },
      ],
      attendances: [
        {
          id: "1",
          date: "2024-01-10",
          clockIn: "09:00",
          clockOut: "17:00",
          totalHours: 8,
        },
        {
          id: "2",
          date: "2024-01-11",
          clockIn: "09:15",
          clockOut: "17:00",
          totalHours: 7.75,
        },
      ],
      payrolls: [
        {
          id: "1",
          period: "December 2023",
          baseSalary: 5000,
          netPay: 4500,
        },
      ],
    })
  }, [isAdmin, router])

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

  if (isAdmin) {
    return null // Will redirect in useEffect
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.username}!
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    My Leaves
                  </Typography>
                  <Typography variant="h4">{employeeData.leaves.length}</Typography>
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
                    This Month Attendance
                  </Typography>
                  <Typography variant="h4">{employeeData.attendances.length}</Typography>
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
                    Last Payroll
                  </Typography>
                  <Typography variant="h4">${employeeData.payrolls[0]?.netPay || 0}</Typography>
                </Box>
                <Box sx={{ color: "#9c27b0" }}>
                  <Payment fontSize="large" />
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
                    Profile Status
                  </Typography>
                  <Typography variant="h6">Active</Typography>
                </Box>
                <Box sx={{ color: "#1976d2" }}>
                  <Person fontSize="large" />
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
              Recent Leave Requests
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Dates</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employeeData.leaves.map((leave: any) => (
                    <TableRow key={leave.id}>
                      <TableCell>{leave.type}</TableCell>
                      <TableCell>
                        {new Date(leave.startDate).toLocaleDateString()} -{" "}
                        {new Date(leave.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip label={leave.status} color={getStatusColor(leave.status) as any} size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Attendance
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Clock In</TableCell>
                    <TableCell>Clock Out</TableCell>
                    <TableCell>Hours</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employeeData.attendances.map((attendance: any) => (
                    <TableRow key={attendance.id}>
                      <TableCell>{new Date(attendance.date).toLocaleDateString()}</TableCell>
                      <TableCell>{attendance.clockIn}</TableCell>
                      <TableCell>{attendance.clockOut}</TableCell>
                      <TableCell>{attendance.totalHours}h</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <EmployeeDashboard />
      </Layout>
    </ProtectedRoute>
  )
}
