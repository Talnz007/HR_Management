"use client"
import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Chip,
} from "@mui/material"
import { Add, Edit, Delete } from "@mui/icons-material"
import { apiService } from "../../services/apiService"
import toast from "react-hot-toast"
import { ProtectedRoute } from "../../components/ProtectedRoute"
import Layout from "../../components/Layout"

interface Attendance {
  attendance_id: string
  employee_id: string
  date: string
  clock_in?: string
  clock_out?: string
  break_start?: string
  break_end?: string
  attendance_type: string
  total_hours?: number
  overtime_hours?: number
}

function AttendanceManagement() {
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null)
  const [formData, setFormData] = useState({
    employee_id: "",
    date: "",
    clock_in: "",
    clock_out: "",
    break_start: "",
    break_end: "",
    attendance_type: "present",
    total_hours: "",
    overtime_hours: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [attendancesData, employeesData] = await Promise.all([
        apiService.getAttendances(),
        apiService.getEmployees(),
      ])
      setAttendances(attendancesData)
      setEmployees(employeesData)
    } catch (error) {
      toast.error("Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (attendance?: Attendance) => {
    if (attendance) {
      setEditingAttendance(attendance)
      setFormData({
        employee_id: attendance.employee_id,
        date: attendance.date,
        clock_in: attendance.clock_in || "",
        clock_out: attendance.clock_out || "",
        break_start: attendance.break_start || "",
        break_end: attendance.break_end || "",
        attendance_type: attendance.attendance_type,
        total_hours: attendance.total_hours?.toString() || "",
        overtime_hours: attendance.overtime_hours?.toString() || "",
      })
    } else {
      setEditingAttendance(null)
      setFormData({
        employee_id: "",
        date: "",
        clock_in: "",
        clock_out: "",
        break_start: "",
        break_end: "",
        attendance_type: "present",
        total_hours: "",
        overtime_hours: "",
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingAttendance(null)
  }

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        total_hours: formData.total_hours ? Number.parseFloat(formData.total_hours) : null,
        overtime_hours: formData.overtime_hours ? Number.parseFloat(formData.overtime_hours) : null,
        clock_in: formData.clock_in || null,
        clock_out: formData.clock_out || null,
        break_start: formData.break_start || null,
        break_end: formData.break_end || null,
      }

      if (editingAttendance) {
        await apiService.updateAttendance(editingAttendance.attendance_id, submitData)
        toast.success("Attendance updated successfully")
      } else {
        await apiService.createAttendance(submitData)
        toast.success("Attendance created successfully")
      }

      handleCloseDialog()
      fetchData()
    } catch (error) {
      toast.error("Failed to save attendance")
    }
  }

  const handleDelete = async (attendanceId: string) => {
    if (window.confirm("Are you sure you want to delete this attendance record?")) {
      try {
        await apiService.deleteAttendance(attendanceId)
        toast.success("Attendance deleted successfully")
        fetchData()
      } catch (error) {
        toast.error("Failed to delete attendance")
      }
    }
  }

  const getAttendanceTypeColor = (type: string) => {
    switch (type) {
      case "present":
        return "success"
      case "late":
        return "warning"
      case "absent":
        return "error"
      default:
        return "default"
    }
  }

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((emp) => emp.employee_id === employeeId)
    return employee ? `${employee.first_name} ${employee.last_name}` : "Unknown"
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Attendance Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Add Attendance
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Clock In</TableCell>
              <TableCell>Clock Out</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Total Hours</TableCell>
              <TableCell>Overtime</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attendances.map((attendance) => (
              <TableRow key={attendance.attendance_id}>
                <TableCell>{getEmployeeName(attendance.employee_id)}</TableCell>
                <TableCell>{new Date(attendance.date).toLocaleDateString()}</TableCell>
                <TableCell>{attendance.clock_in || "-"}</TableCell>
                <TableCell>{attendance.clock_out || "-"}</TableCell>
                <TableCell>
                  <Chip
                    label={attendance.attendance_type}
                    color={getAttendanceTypeColor(attendance.attendance_type) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{attendance.total_hours || "-"}</TableCell>
                <TableCell>{attendance.overtime_hours || "-"}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(attendance)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(attendance.attendance_id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingAttendance ? "Edit Attendance" : "Add Attendance"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Employee"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              >
                {employees.map((employee) => (
                  <MenuItem key={employee.employee_id} value={employee.employee_id}>
                    {`${employee.first_name} ${employee.last_name}`}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Clock In"
                type="time"
                InputLabelProps={{ shrink: true }}
                value={formData.clock_in}
                onChange={(e) => setFormData({ ...formData, clock_in: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Clock Out"
                type="time"
                InputLabelProps={{ shrink: true }}
                value={formData.clock_out}
                onChange={(e) => setFormData({ ...formData, clock_out: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Break Start"
                type="time"
                InputLabelProps={{ shrink: true }}
                value={formData.break_start}
                onChange={(e) => setFormData({ ...formData, break_start: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Break End"
                type="time"
                InputLabelProps={{ shrink: true }}
                value={formData.break_end}
                onChange={(e) => setFormData({ ...formData, break_end: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Attendance Type"
                value={formData.attendance_type}
                onChange={(e) => setFormData({ ...formData, attendance_type: e.target.value })}
              >
                <MenuItem value="present">Present</MenuItem>
                <MenuItem value="absent">Absent</MenuItem>
                <MenuItem value="late">Late</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total Hours"
                type="number"
                step="0.5"
                value={formData.total_hours}
                onChange={(e) => setFormData({ ...formData, total_hours: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Overtime Hours"
                type="number"
                step="0.5"
                value={formData.overtime_hours}
                onChange={(e) => setFormData({ ...formData, overtime_hours: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingAttendance ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default function AttendanceManagementPage() {
  return (
    <ProtectedRoute requireAdmin>
      <Layout>
        <AttendanceManagement />
      </Layout>
    </ProtectedRoute>
  )
}
