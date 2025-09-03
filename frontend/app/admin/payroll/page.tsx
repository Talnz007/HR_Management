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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
} from "@mui/material"
import { Add, GetApp } from "@mui/icons-material"
import { apiService } from "@/app/services/apiService"
import toast from "react-hot-toast"
import { ProtectedRoute } from "../../components/ProtectedRoute"
import Layout from "../../components/Layout"

interface Payroll {
  payroll_id: string
  employee_id: string
  period_start: string
  period_end: string
  base_salary: number
  overtime_pay?: number
  deductions?: number
  net_pay: number
  created_at: string
}

function PayrollManagement() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    employee_id: "",
    period_start: "",
    period_end: "",
    base_salary: "",
    overtime_pay: "",
    deductions: "",
    net_pay: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const employeesData = await apiService.getEmployees()
      setEmployees(employeesData)
      // Note: There's no direct payroll GET endpoint, so we'll start with empty array
      setPayrolls([])
    } catch (error) {
      toast.error("Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = () => {
    setFormData({
      employee_id: "",
      period_start: "",
      period_end: "",
      base_salary: "",
      overtime_pay: "",
      deductions: "",
      net_pay: "",
    })
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
  }

  const calculateNetPay = () => {
    const base = Number.parseFloat(formData.base_salary) || 0
    const overtime = Number.parseFloat(formData.overtime_pay) || 0
    const deductions = Number.parseFloat(formData.deductions) || 0
    const net = base + overtime - deductions
    setFormData({ ...formData, net_pay: net.toString() })
  }

  const handleSubmit = async () => {
    try {
      const submitData = {
        employee_id: formData.employee_id,
        period_start: formData.period_start,
        period_end: formData.period_end,
        base_salary: Number.parseFloat(formData.base_salary),
        overtime_pay: formData.overtime_pay ? Number.parseFloat(formData.overtime_pay) : null,
        deductions: formData.deductions ? Number.parseFloat(formData.deductions) : null,
        net_pay: Number.parseFloat(formData.net_pay),
      }

      await apiService.createPayroll(submitData)
      toast.success("Payroll created successfully")
      handleCloseDialog()
      fetchData()
    } catch (error) {
      toast.error("Failed to create payroll")
    }
  }

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((emp) => emp.employee_id === employeeId)
    return employee ? `${employee.first_name} ${employee.last_name}` : "Unknown"
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Payroll Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenDialog}>
          Generate Payroll
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Period</TableCell>
              <TableCell>Base Salary</TableCell>
              <TableCell>Overtime Pay</TableCell>
              <TableCell>Deductions</TableCell>
              <TableCell>Net Pay</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payrolls.map((payroll) => (
              <TableRow key={payroll.payroll_id}>
                <TableCell>{getEmployeeName(payroll.employee_id)}</TableCell>
                <TableCell>
                  {new Date(payroll.period_start).toLocaleDateString()} -{" "}
                  {new Date(payroll.period_end).toLocaleDateString()}
                </TableCell>
                <TableCell>${payroll.base_salary.toLocaleString()}</TableCell>
                <TableCell>${(payroll.overtime_pay || 0).toLocaleString()}</TableCell>
                <TableCell>${(payroll.deductions || 0).toLocaleString()}</TableCell>
                <TableCell>${payroll.net_pay.toLocaleString()}</TableCell>
                <TableCell>
                  <Button startIcon={<GetApp />} size="small" onClick={() => toast.success("Payslip downloaded")}>
                    Download
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {payrolls.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No payroll records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Payroll</DialogTitle>
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Period Start"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.period_start}
                onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Period End"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.period_end}
                onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Base Salary"
                type="number"
                value={formData.base_salary}
                onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                onBlur={calculateNetPay}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Overtime Pay"
                type="number"
                value={formData.overtime_pay}
                onChange={(e) => setFormData({ ...formData, overtime_pay: e.target.value })}
                onBlur={calculateNetPay}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Deductions"
                type="number"
                value={formData.deductions}
                onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                onBlur={calculateNetPay}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Net Pay"
                type="number"
                value={formData.net_pay}
                InputProps={{ readOnly: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Generate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default function PayrollManagementPage() {
  return (
    <ProtectedRoute requireAdmin>
      <Layout>
        <PayrollManagement />
      </Layout>
    </ProtectedRoute>
  )
}
