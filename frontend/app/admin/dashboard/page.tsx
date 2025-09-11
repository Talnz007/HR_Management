"use client";

import { useState, useEffect } from "react";
import { Grid, Card, CardContent, Typography, Box, Paper, Skeleton } from "@mui/material";
import { People, EventNote, Schedule, Payment } from "@mui/icons-material";
import { apiService } from "../../services/apiService";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import Layout from "../../components/Layout";
import toast from "react-hot-toast";

interface DashboardStats {
  totalEmployees: number;
  pendingLeaves: number;
  todayAttendance: number;
  monthlyPayroll: number;
}

function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const dashboardStats = await apiService.getDashboardStats();
        setStats(dashboardStats);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: "Total Employees",
      value: stats?.totalEmployees,
      icon: <People fontSize="large" />,
      color: "#1976d2",
    },
    {
      title: "Pending Leaves",
      value: stats?.pendingLeaves,
      icon: <EventNote fontSize="large" />,
      color: "#ed6c02",
    },
    {
      title: "Today's Attendance",
      value: stats?.todayAttendance,
      icon: <Schedule fontSize="large" />,
      color: "#2e7d32",
    },
    {
      title: "Monthly Payroll",
      value: stats ? `$${stats.monthlyPayroll.toLocaleString()}` : 0,
      icon: <Payment fontSize="large" />,
      color: "#9c27b0",
    },
  ];

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
                    {loading ? (
                       <Skeleton variant="text" width={80} height={40} />
                    ) : (
                      <Typography variant="h4">{card.value}</Typography>
                    )}
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
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recent Activities
            </Typography>
            {loading ? (
              <>
                <Skeleton variant="text" />
                <Skeleton variant="text" />
                <Skeleton variant="text" />
              </>
            ) : (
              <>
                <Typography variant="body2" color="textSecondary">
                  • New employee John Doe added
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • Leave request approved for Jane Smith
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • Payroll processed for December
                </Typography>
              </>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
             {loading ? (
              <>
                <Skeleton variant="text" />
                <Skeleton variant="text" />
                <Skeleton variant="text" />
              </>
            ) : (
            <>
              <Typography variant="body2" color="textSecondary">
                • Add new employee
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Process payroll
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Review leave requests
              </Typography>
            </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <AdminDashboard />
      </Layout>
    </ProtectedRoute>
  );
}
