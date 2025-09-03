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
import { Add, Edit, Delete, Check, Close } from "@mui/icons-material"
import { apiService } from "@/app/services/apiService"
import toast from "react-hot-toast"
import { ProtectedRoute } from "../../components/ProtectedRoute"
import Layout from "../../components/Layout"

interface Leave {
  leave_id: string
  employee_id: string
  leave_type: string
  start_date: string
  end_date: string
  status: string
  created_at: string
}

function LeaveManagement() {
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLeave, setEditingLeave] = useState<Leave | null>(null)
  const [formData, setFormData] = useState({
    employee_id: "",
    leave_type: "vacation",
    start_date: "",
    end_date: "",
    status: "pending",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [leavesData, employeesData] = await Promise.all([apiService.getLeaves(), apiService.getEmployees()])
      setLeaves(leavesData)
      setEmployees(employeesData)
    } catch (error) {
      toast.error("Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (leave?: Leave) => {
    if (leave) {
      setEditingLeave(leave)
      setFormData({
        employee_id: leave.employee_id,
        leave_type: leave.leave_type,
        start_date: leave.start_date,
        end_date: leave.end_date,
        status: leave.status,
      })
    } else {
      setEditingLeave(null)
      setFormData({
        employee_id: "",
        leave_type: "vacation",
        start_date: "",
        end_date: "",
        status: "pending",
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingLeave(null)
  }

  const handleSubmit = async () => {
    try {
      if (editingLeave) {
        await apiService.updateLeave(editingLeave.leave_id, formData)
        toast.success("Leave updated successfully")
      } else {
        await apiService.createLeave(formData)
        toast.success("Leave created successfully")
      }

      handleCloseDialog()
      fetchData()
    } catch (error) {
      toast.error("Failed to save leave")
    }
  }

  const handleDelete = async (leaveId: string) => {
    if (window.confirm("Are you sure you want to delete this leave?")) {
      try {
        await apiService.deleteLeave(leaveId)
        toast.success("Leave deleted successfully")
        fetchData()
      } catch (error) {
        toast.error("Failed to delete leave")
      }
    }
  }

  const handleStatusUpdate = async (leaveId: string, status: string) => {
    try {
      const leave = leaves.find((l) => l.leave_id === leaveId)
      if (leave) {
        await apiService.updateLeave(leaveId, { ...leave, status })
        toast.success(`Leave ${status} successfully`)
        fetchData()
      }
    } catch (error) {
      toast.error("Failed to update leave status")
    }
  }

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

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((emp) => emp.employee_id === employeeId)
    return employee ? `${employee.first_name} ${employee.last_name}` : "Unknown"
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Leave Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Add Leave
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Leave Type</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaves.map((leave) => (
              <TableRow key={leave.leave_id}>
                <TableCell>{getEmployeeName(leave.employee_id)}</TableCell>
                <TableCell>{leave.leave_type.replace("_", " ")}</TableCell>
                <TableCell>{new Date(leave.start_date).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(leave.end_date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Chip label={leave.status} color={getStatusColor(leave.status) as any} size="small" />
                </TableCell>
                <TableCell>
                  {leave.status === "pending" && (
                    <>
                      <IconButton onClick={() => handleStatusUpdate(leave.leave_id, "approved")} color="success">
                        <Check />
                      </IconButton>
                      <IconButton onClick={() => handleStatusUpdate(leave.leave_id, "rejected")} color="error">
                        <Close />
                      </IconButton>
                    </>
                  )}
                  <IconButton onClick={() => handleOpenDialog(leave)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(leave.leave_id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingLeave ? "Edit Leave" : "Add Leave"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Leave Type"
                value={formData.leave_type}
                onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
              >
                <MenuItem value="sick">Sick</MenuItem>
                <MenuItem value="vacation">Vacation</MenuItem>
                <MenuItem value="personal">Personal</MenuItem>
                <MenuItem value="unpaid">Unpaid</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingLeave ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default function LeaveManagementPage() {
  return (
    <ProtectedRoute requireAdmin>
      <Layout>
        <LeaveManagement />
      </Layout>
    </ProtectedRoute>
  )
}
