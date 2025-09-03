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
  Chip,
  CircularProgress,
  Alert,
  Button
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { apiService } from "../services/apiService";
import { useAuth } from "@/src/contexts/AuthContext";
import Layout from "../components/Layout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useRouter } from "next/navigation";

interface LeaveRecord {
  leave_id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

export default function LeavesPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <MyLeaves />
      </Layout>
    </ProtectedRoute>
  );
}

function MyLeaves() {
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  const fetchMyLeaves = async () => {
    setLoading(true);
    try {
      const leaveData = await apiService.getMyLeaves();
      setLeaves(leaveData);
    } catch (err) {
      console.error("Error fetching leaves:", err);
      setError("Failed to load leave records");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "success";
      case "pending":
        return "warning";
      case "rejected":
        return "error";
      default:
        return "default";
    }
  };

  const getLeaveTypeDisplay = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const handleRequestLeave = () => {
    router.push("/leave/request");
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          My Leave Requests
        </Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleRequestLeave}
        >
          Request Leave
        </Button>
      </Box>

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
                <TableCell>Type</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Requested On</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaves.length > 0 ? (
                leaves.map((leave) => {
                  // Calculate duration in days
                  const start = new Date(leave.start_date);
                  const end = new Date(leave.end_date);
                  const diffTime = Math.abs(end.getTime() - start.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 because inclusive

                  return (
                    <TableRow key={leave.leave_id}>
                      <TableCell>{getLeaveTypeDisplay(leave.leave_type)}</TableCell>
                      <TableCell>{new Date(leave.start_date).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(leave.end_date).toLocaleDateString()}</TableCell>
                      <TableCell>{diffDays} day{diffDays !== 1 ? 's' : ''}</TableCell>
                      <TableCell>
                        <Chip
                          label={leave.status}
                          color={getStatusColor(leave.status) as any}
                        />
                      </TableCell>
                      <TableCell>{new Date(leave.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No leave records found
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