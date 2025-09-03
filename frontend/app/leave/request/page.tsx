"use client"

import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  SelectChangeEvent
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useRouter } from "next/navigation";
import { apiService } from "../../services/apiService";
import { useAuth } from "@/src/contexts/AuthContext";
import Layout from "../../components/Layout";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import toast from "react-hot-toast";

// Define an interface for leave request data
interface LeaveRequestData {
  leave_type: "sick" | "vacation" | "personal" | "unpaid";
  start_date: string;
  end_date: string;
}

export default function LeaveRequestPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <LeaveRequestForm />
      </Layout>
    </ProtectedRoute>
  );
}

function LeaveRequestForm() {
  const [leaveType, setLeaveType] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();
  const { user } = useAuth();

  const handleLeaveTypeChange = (event: SelectChangeEvent) => {
    setLeaveType(event.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!leaveType || !startDate || !endDate) {
      setError("Please fill in all required fields");
      return;
    }

    if (endDate < startDate) {
      setError("End date cannot be before start date");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiService.createLeaveSelf({
        leave_type: leaveType as "sick" | "vacation" | "personal" | "unpaid",
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      });

      toast.success("Leave request submitted successfully");
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Leave request error:", err);
      setError(err.response?.data?.detail || "Failed to submit leave request");
      toast.error("Failed to submit leave request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Request Leave
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <FormControl fullWidth margin="normal">
            <InputLabel>Leave Type</InputLabel>
            <Select
              value={leaveType}
              label="Leave Type"
              onChange={handleLeaveTypeChange}
              required
            >
              <MenuItem value="sick">Sick Leave</MenuItem>
              <MenuItem value="vacation">Vacation Leave</MenuItem>
              <MenuItem value="personal">Personal Leave</MenuItem>
              <MenuItem value="unpaid">Unpaid Leave</MenuItem>
            </Select>
          </FormControl>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ mt: 2, mb: 2 }}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue: Date | null) => setStartDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Box>

            <Box sx={{ mt: 2, mb: 2 }}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue: Date | null) => setEndDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
                minDate={startDate || undefined}
              />
            </Box>
          </LocalizationProvider>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : "Submit Leave Request"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}