"use client"
import { useState, useEffect } from "react"
import { Grid, Card, CardContent, Typography, Box, Paper } from "@mui/material"
import { People, EventNote, Schedule, Payment } from "@mui/icons-material"
import { apiService } from "../../services/apiService"
import { ProtectedRoute } from "../../components/ProtectedRoute"
import Layout from "../../components/Layout"

interface DashboardStats {
  totalEmployees: number
  pendingLeaves: number
  todayAttendance: number
  monthlyPayroll: number
}

function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    pendingLeaves: 0,
    todayAttendance: 0,
    monthlyPayroll: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch data from various endpoints to calculate stats
        const [employees, leaves, attendances] = await Promise.all([
          apiService.getEmployees(),
          apiService.getLeaves(),
          apiService.getAttendances(),
        ])

        const today = new Date().toISOString().split("T")[0]
        const pendingLeaves = leaves.filter((leave: any) => leave.status === "pending").length
        const todayAttendance = attendances.filter((att: any) => att.date === today).length

        setStats({
          totalEmployees: employees.length,
          pendingLeaves,
          todayAttendance,
          monthlyPayroll: employees.length * 5000, // Mock calculation
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const statCards = [
    {
      title: "Total Employees",
      value: stats.totalEmployees,
      icon: <People fontSize="large" />,
      color: "#1976d2",
    },
    {
      title: "Pending Leaves",
      value: stats.pendingLeaves,
      icon: <EventNote fontSize="large" />,
      color: "#ed6c02",
    },
    {
      title: "Today's Attendance",
      value: stats.todayAttendance,
      icon: <Schedule fontSize="large" />,
      color: "#2e7d32",
    },
    {
      title: "Monthly Payroll",
      value: `$${stats.monthlyPayroll.toLocaleString()}`,
      icon: <Payment fontSize="large" />,
      color: "#9c27b0",
    },
  ]

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h4">{card.value}</Typography>
                  </Box>
                  <Box sx={{ color: card.color }}>{card.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activities
            </Typography>
            <Typography variant="body2" color="textSecondary">
              • New employee John Doe added
            </Typography>
            <Typography variant="body2" color="textSecondary">
              • Leave request approved for Jane Smith
            </Typography>
            <Typography variant="body2" color="textSecondary">
              • Payroll processed for December
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Typography variant="body2" color="textSecondary">
              • Add new employee
            </Typography>
            <Typography variant="body2" color="textSecondary">
              • Process payroll
            </Typography>
            <Typography variant="body2" color="textSecondary">
              • Review leave requests
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute requireAdmin>
      <Layout>
        <AdminDashboard />
      </Layout>
    </ProtectedRoute>
  )
}
