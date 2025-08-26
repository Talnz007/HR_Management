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
import { ProfileAvatar } from "@/app/components/ProfileAvatar"

// Define the Department interface based on the API response
interface Department {
  department_id: string;
  name: string;
  created_at: string;
  updated_at: string | null;
}

interface Employee {
  employee_id: string
  employee_number: string
  first_name: string
  middle_name?: string
  last_name: string
  email?: string
  phone: string
  job_title: string
  department_id: string
  employment_type: string
  status: string
  salary?: number
  hire_date: string
  profile_picture_key?: string | null
}

function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([]) // Add state for departments
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState({
    employee_number: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    phone: "",
    job_title: "",
    department_id: "",
    employment_type: "full_time",
    status: "active",
    salary: "",
    hire_date: "",
    date_of_birth: "",
    password: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [employeesData, departmentsData] = await Promise.all([
          apiService.getEmployees(),
          apiService.getDepartments(), // Fetch departments
        ]);
        setEmployees(employeesData);
        setDepartments(departmentsData);
      } catch (error) {
        toast.error("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchEmployees = async () => {
    try {
      const data = await apiService.getEmployees()
      setEmployees(data)
    } catch (error) {
      toast.error("Failed to fetch employees")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee)
      setFormData({
        employee_number: employee.employee_number,
        first_name: employee.first_name,
        middle_name: employee.middle_name || "",
        last_name: employee.last_name,
        phone: employee.phone,
        job_title: employee.job_title,
        department_id: employee.department_id,
        employment_type: employee.employment_type,
        status: employee.status,
        salary: employee.salary?.toString() || "",
        hire_date: employee.hire_date,
        date_of_birth: "",
        password: "",
      })
    } else {
      setEditingEmployee(null)
      setFormData({
        employee_number: "",
        first_name: "",
        middle_name: "",
        last_name: "",
        phone: "",
        job_title: "",
        department_id: "",
        employment_type: "full_time",
        status: "active",
        salary: "",
        hire_date: "",
        date_of_birth: "",
        password: "",
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingEmployee(null)
  }

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        salary: formData.salary ? Number.parseFloat(formData.salary) : null,
      }

      if (editingEmployee) {
        await apiService.updateEmployee(editingEmployee.employee_id, submitData)
        toast.success("Employee updated successfully")
      } else {
        await apiService.createEmployee(submitData)
        toast.success("Employee created successfully")
      }

      handleCloseDialog()
      fetchEmployees()
    } catch (error) {
      toast.error("Failed to save employee")
    }
  }

  const handleDelete = async (employeeId: string) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        await apiService.deleteEmployee(employeeId)
        toast.success("Employee deleted successfully")
        fetchEmployees()
      } catch (error) {
        toast.error("Failed to delete employee")
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success"
      case "inactive":
        return "warning"
      case "terminated":
        return "error"
      default:
        return "default"
    }
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Employee Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Add Employee
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Avatar</TableCell>
              <TableCell>Employee #</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Job Title</TableCell>
              <TableCell>Employment Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Hire Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.employee_id}>
                <TableCell>
                  <ProfileAvatar
                    user={{
                      first_name: employee.first_name,
                      last_name: employee.last_name,
                      profile_picture_key: employee.profile_picture_key
                    }}
                    className="w-10 h-10"
                  />
                </TableCell>
                <TableCell>{employee.employee_number}</TableCell>
                <TableCell>
                  {`${employee.first_name} ${employee.middle_name || ""} ${employee.last_name}`.trim()}
                </TableCell>
                <TableCell>{employee.job_title}</TableCell>
                <TableCell>{employee.employment_type.replace("_", " ")}</TableCell>
                <TableCell>
                  <Chip label={employee.status} color={getStatusColor(employee.status) as any} size="small" />
                </TableCell>
                <TableCell>{new Date(employee.hire_date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(employee)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(employee.employee_id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingEmployee ? "Edit Employee" : "Add Employee"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Employee Number"
                value={formData.employee_number}
                onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Middle Name"
                value={formData.middle_name}
                onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Job Title"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Department"
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.department_id} value={dept.department_id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Employment Type"
                value={formData.employment_type}
                onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
              >
                <MenuItem value="full_time">Full Time</MenuItem>
                <MenuItem value="part_time">Part Time</MenuItem>
                <MenuItem value="contract">Contract</MenuItem>
                <MenuItem value="intern">Intern</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="terminated">Terminated</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Salary"
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hire Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              />
            </Grid>
            {!editingEmployee && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingEmployee ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default function EmployeeManagementPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <EmployeeManagement />
      </Layout>
    </ProtectedRoute>
  )
}
