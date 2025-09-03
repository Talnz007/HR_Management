"use client"

import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Alert
} from "@mui/material";
import { apiService } from "../../services/apiService";
import { useAuth } from "@/src/contexts/AuthContext";
import Layout from "../../components/Layout";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import toast from "react-hot-toast";

interface LeaveRequest {
  leave_id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  employee_name?: string; // We'll add this from the employee data
}

interface Employee {
  employee_id: string;
  first_name: string;
  last_name: string;
  // Add other properties as needed
}

export default function ManagerLeavesPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <LeaveApprovalDashboard />
      </Layout>
    </ProtectedRoute>
  );
}

function LeaveApprovalDashboard() {
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const { isManager, isAdmin } = useAuth();

  useEffect(() => {
    if (!isManager && !isAdmin) {
      return;
    }

    fetchPendingLeaves();
  }, [isManager, isAdmin]);

  const fetchPendingLeaves = async () => {
    setLoading(true);
    try {
      // Fetch all pending leaves
      const leaves: LeaveRequest[] = await apiService.getPendingLeaves();

      // Get employee details to show names
      const employeeMap = new Map<string, string>();
      const employees: Employee[] = await apiService.getTeamMembers();

      employees.forEach((emp: Employee) => {
        employeeMap.set(emp.employee_id, `${emp.first_name} ${emp.last_name}`);
      });

      // Enhance leave records with employee names
      const enhancedLeaves = leaves.map((leave: LeaveRequest) => ({
        ...leave,
        employee_name: employeeMap.get(leave.employee_id) || 'Unknown'
      }));

      setPendingLeaves(enhancedLeaves);
    } catch (err) {
      console.error("Error fetching pending leaves:", err);
      setError("Failed to load pending leave requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId: string) => {
    try {
      await apiService.updateLeave(leaveId, { status: "approved" });
      toast.success("Leave request approved");
      fetchPendingLeaves(); // Refresh the list
    } catch (err) {
      console.error("Error approving leave:", err);
      toast.error("Failed to approve leave request");
    }
  };

  const handleReject = async (leaveId: string) => {
    try {
      await apiService.updateLeave(leaveId, { status: "rejected" });
      toast.success("Leave request rejected");
      fetchPendingLeaves(); // Refresh the list
    } catch (err) {
      console.error("Error rejecting leave:", err);
      toast.error("Failed to reject leave request");
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Leave Requests Approval
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingLeaves.length > 0 ? (
                pendingLeaves.map((leave: LeaveRequest) => (
                  <TableRow key={leave.leave_id}>
                    <TableCell>{leave.employee_name}</TableCell>
                    <TableCell>
                      {leave.leave_type.charAt(0).toUpperCase() + leave.leave_type.slice(1)}
                    </TableCell>
                    <TableCell>{new Date(leave.start_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(leave.end_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={leave.status}
                        color={
                          leave.status === "approved" ? "success" :
                          leave.status === "rejected" ? "error" : "warning"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {leave.status === "pending" && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => handleApprove(leave.leave_id)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={() => handleReject(leave.leave_id)}
                          >
                            Reject
                          </Button>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No pending leave requests found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}