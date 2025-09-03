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
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";
import { apiService } from "../../services/apiService";
import { useAuth } from "@/src/contexts/AuthContext";
import Layout from "../../components/Layout";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { CalendarToday } from "@mui/icons-material";
import { format, subDays, isToday, isYesterday } from "date-fns";

interface AttendanceRecord {
  attendance_id: string;
  user_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  total_hours: number | null;
  attendance_type: string;
  employee_name?: string;
}

export default function TeamAttendancePage() {
  return (
    <ProtectedRoute>
      <Layout>
        <TeamAttendanceDashboard />
      </Layout>
    </ProtectedRoute>
  );
}

function TeamAttendanceDashboard() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFilter, setDateFilter] = useState("today");
  const { isManager, isAdmin } = useAuth();

  useEffect(() => {
    if (!isManager && !isAdmin) {
      return;
    }

    fetchTeamAttendance();
  }, [isManager, isAdmin, dateFilter]);

  const fetchTeamAttendance = async () => {
    setLoading(true);
    try {
      // Determine the date range based on filter
      let dateFrom, dateTo;
      const today = new Date();

      switch (dateFilter) {
        case 'today':
          dateFrom = format(today, 'yyyy-MM-dd');
          dateTo = dateFrom;
          break;
        case 'yesterday':
          dateFrom = format(subDays(today, 1), 'yyyy-MM-dd');
          dateTo = dateFrom;
          break;
        case 'week':
          dateFrom = format(subDays(today, 7), 'yyyy-MM-dd');
          dateTo = format(today, 'yyyy-MM-dd');
          break;
        default:
          dateFrom = format(today, 'yyyy-MM-dd');
          dateTo = dateFrom;
      }

      // Get all attendance records (in a real implementation, you'd add date filtering to the API)
      const allAttendance = await apiService.getAttendances();

      // Filter by date range
      const filteredAttendance = allAttendance.filter(record => {
        const recordDate = record.date;
        return recordDate >= dateFrom && recordDate <= dateTo;
      });

      // Get team members to add names
      const employees = await apiService.getEmployees();
      const userMap = new Map();

      employees.forEach(emp => {
        userMap.set(emp.user_id, `${emp.first_name} ${emp.last_name}`);
      });

      // Add employee names to attendance records
      const enhancedRecords = filteredAttendance.map(record => ({
        ...record,
        employee_name: userMap.get(record.user_id) || 'Unknown'
      }));

      setAttendanceRecords(enhancedRecords);
    } catch (err) {
      console.error("Error fetching team attendance:", err);
      setError("Failed to load team attendance data");
    } finally {
      setLoading(false);
    }
  };

  const getDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, 'MMM dd, yyyy');
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
          Team Attendance
        </Typography>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Date Range</InputLabel>
          <Select
            value={dateFilter}
            label="Date Range"
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="yesterday">Yesterday</MenuItem>
            <MenuItem value="week">Last 7 Days</MenuItem>
          </Select>
        </FormControl>
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
                <TableCell>Employee</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Clock In</TableCell>
                <TableCell>Clock Out</TableCell>
                <TableCell>Total Hours</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendanceRecords.length > 0 ? (
                attendanceRecords.map((record) => (
                  <TableRow key={record.attendance_id}>
                    <TableCell>{record.employee_name}</TableCell>
                    <TableCell>{getDateDisplay(record.date)}</TableCell>
                    <TableCell>{record.clock_in || 'N/A'}</TableCell>
                    <TableCell>{record.clock_out || 'N/A'}</TableCell>
                    <TableCell>{record.total_hours?.toFixed(2) || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={record.attendance_type}
                        color={
                          record.attendance_type === "present" ? "success" :
                          record.attendance_type === "late" ? "warning" : "error"
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No attendance records found for this period
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