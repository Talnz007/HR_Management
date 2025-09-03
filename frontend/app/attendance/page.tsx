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
  Button,
  Card,
  CardContent,
  Grid
} from "@mui/material";
import { AccessTime, PlayArrow, Stop, Pause } from "@mui/icons-material";
import { apiService } from "../services/apiService";
import { useAuth } from "@/src/contexts/AuthContext";
import Layout from "../components/Layout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import toast from "react-hot-toast";

interface AttendanceRecord {
  attendance_id: string;
  user_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  break_start: string | null;
  break_end: string | null;
  attendance_type: string;
  total_hours: number | null;
  overtime_hours: number | null;
}

export default function AttendancePage() {
  return (
    <ProtectedRoute>
      <Layout>
        <MyAttendance />
      </Layout>
    </ProtectedRoute>
  );
}

function MyAttendance() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const { user } = useAuth();

  useEffect(() => {
    fetchAttendanceData();

    // Update current time every second
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      // Get today's attendance
      const today = await apiService.getTodayAttendance();
      if (today && today.attendance_id) {
        setTodayAttendance(today);
      }

      // Get attendance history
      const history = await apiService.getMyAttendances();
      setAttendanceRecords(history);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setError("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      const response = await apiService.startAttendance();
      toast.success("You have clocked in successfully");
      setTodayAttendance(response);
    } catch (error) {
      console.error("Error clocking in:", error);
      toast.error("Failed to clock in");
    }
  };

  const handleClockOut = async () => {
    try {
      const response = await apiService.stopAttendance();
      toast.success("You have clocked out successfully");
      setTodayAttendance(response);
      // Refresh attendance history as well
      const history = await apiService.getMyAttendances();
      setAttendanceRecords(history);
    } catch (error) {
      console.error("Error clocking out:", error);
      toast.error("Failed to clock out");
    }
  };

  const handleBreak = async () => {
    try {
      const response = await apiService.pauseAttendance();

      if (!todayAttendance?.break_start) {
        toast.success("Break started");
      } else if (todayAttendance?.break_start && !todayAttendance?.break_end) {
        toast.success("Break ended");
      }

      setTodayAttendance(response);
    } catch (error) {
      console.error("Error managing break:", error);
      toast.error("Failed to update break status");
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "N/A";
    return timeString;
  };

  const getWorkStatus = () => {
    if (!todayAttendance) return "Not Started";
    if (todayAttendance.clock_out) return "Completed";
    if (todayAttendance.break_start && !todayAttendance.break_end) return "On Break";
    return "Working";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Working":
        return "success";
      case "On Break":
        return "warning";
      case "Completed":
        return "info";
      default:
        return "default";
    }
  };

  const calculateWorkedTime = () => {
    if (!todayAttendance || !todayAttendance.clock_in) return "0h 0m";

    const clockIn = todayAttendance.clock_in ? new Date(`2000-01-01T${todayAttendance.clock_in}`) : null;
    const clockOut = todayAttendance.clock_out ? new Date(`2000-01-01T${todayAttendance.clock_out}`) : new Date();

    let breakTime = 0;
    if (todayAttendance.break_start && todayAttendance.break_end) {
      const breakStart = new Date(`2000-01-01T${todayAttendance.break_start}`);
      const breakEnd = new Date(`2000-01-01T${todayAttendance.break_end}`);
      breakTime = breakEnd.getTime() - breakStart.getTime();
    } else if (todayAttendance.break_start) {
      const breakStart = new Date(`2000-01-01T${todayAttendance.break_start}`);
      breakTime = new Date().getTime() - breakStart.getTime();
    }

    let totalMs = clockIn ? clockOut.getTime() - clockIn.getTime() - breakTime : 0;

    // Ensure we don't have negative time
    totalMs = Math.max(0, totalMs);

    const hours = Math.floor(totalMs / (1000 * 60 * 60));
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
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
        My Attendance
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Today's attendance card */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography variant="h6" gutterBottom>Today's Status</Typography>
                <Chip
                  label={getWorkStatus()}
                  color={getStatusColor(getWorkStatus()) as any}
                  sx={{ mb: 2, px: 2, py: 3, fontSize: '1rem' }}
                />
                <Typography variant="body1">
                  {currentTime.toLocaleTimeString()}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Typography variant="h6" gutterBottom>Time Summary</Typography>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Clock In</Typography>
                  <Typography variant="body1">{formatTime(todayAttendance?.clock_in || null)}</Typography>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Clock Out</Typography>
                  <Typography variant="body1">{formatTime(todayAttendance?.clock_out || null)}</Typography>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Total Time</Typography>
                  <Typography variant="body1">{calculateWorkedTime()}</Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%', justifyContent: 'center' }}>
                {!todayAttendance ? (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PlayArrow />}
                    onClick={handleClockIn}
                    fullWidth
                  >
                    Clock In
                  </Button>
                ) : (
                  <>
                    {!todayAttendance.clock_out && (
                      <Button
                        variant="contained"
                        color={todayAttendance.break_start && !todayAttendance.break_end ? "success" : "warning"}
                        startIcon={todayAttendance.break_start && !todayAttendance.break_end ? <PlayArrow /> : <Pause />}
                        onClick={handleBreak}
                        fullWidth
                        disabled={!!todayAttendance.clock_out}
                      >
                        {todayAttendance.break_start && !todayAttendance.break_end ? "End Break" : "Start Break"}
                      </Button>
                    )}

                    {!todayAttendance.clock_out && (
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<Stop />}
                        onClick={handleClockOut}
                        fullWidth
                      >
                        Clock Out
                      </Button>
                    )}
                  </>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Attendance history table */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Attendance History
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Clock In</TableCell>
                <TableCell>Clock Out</TableCell>
                <TableCell>Break</TableCell>
                <TableCell>Total Hours</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendanceRecords.length > 0 ? (
                attendanceRecords.map((record) => {
                  const breakDuration = record.break_start && record.break_end ?
                    calculateBreakDuration(record.break_start, record.break_end) :
                    "N/A";

                  return (
                    <TableRow key={record.attendance_id}>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>{formatTime(record.clock_in)}</TableCell>
                      <TableCell>{formatTime(record.clock_out)}</TableCell>
                      <TableCell>{breakDuration}</TableCell>
                      <TableCell>{record.total_hours?.toFixed(2) || "N/A"}</TableCell>
                      <TableCell>
                        <Chip
                          label={record.attendance_type}
                          color={
                            record.attendance_type === "present" ? "success" :
                            record.attendance_type === "late" ? "warning" : "error"
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No attendance records found
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

function calculateBreakDuration(startTime: string, endTime: string) {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  const diffMs = end.getTime() - start.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));

  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
}