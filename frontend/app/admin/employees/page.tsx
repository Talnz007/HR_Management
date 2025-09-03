"use client"

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  SupervisorAccount as ManagerIcon,
  AdminPanelSettings as AdminIcon
} from "@mui/icons-material";
import { apiService } from "../../services/apiService";
import { useRouter } from "next/navigation";
import Layout from "../../components/Layout"; // Import Layout
import { ProtectedRoute } from "../../components/ProtectedRoute"; // Import ProtectedRoute

interface Employee {
  employee_id: string;
  user_id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  job_title: string;
  department_id: string;
  department_name?: string;
  status: string;
  role: 'admin' | 'manager' | 'employee'; // Use the role from the API
}

function EmployeesPageContent() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [empData, deptData] = await Promise.all([
          apiService.getEmployees(),
          apiService.getDepartments()
        ]);

        const departmentMap = new Map(deptData.map((dept: any) => [dept.department_id, dept.name]));

        // The role now comes directly from the backend, no more client-side calculation
        const enhancedEmployees = empData.map((emp: any) => ({
          ...emp,
          department_name: departmentMap.get(emp.department_id) || "Unknown",
        }));

        setEmployees(enhancedEmployees);
        setFilteredEmployees(enhancedEmployees);
      } catch (err) {
        console.error("Error fetching employees:", err);
        setError("Failed to load employee data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = employees.filter(emp =>
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.department_name && emp.department_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees(employees);
    }
  }, [searchTerm, employees]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active": return "success";
      case "inactive": return "warning";
      case "terminated": return "error";
      default: return "default";
    }
  };
  
  const getRoleChip = (role: string) => {
      switch(role) {
          case 'admin':
              return <Chip icon={<AdminIcon />} label="Admin" color="secondary" size="small" variant="outlined" />;
          case 'manager':
              return <Chip icon={<ManagerIcon />} label="Manager" color="primary" size="small" variant="outlined" />;
          default:
              return <Chip icon={<PersonIcon />} label="Employee" color="default" size="small" variant="outlined" />;
      }
  }

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Employees</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push("/admin/employees/add")}>
          Add Employee
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TextField fullWidth variant="outlined" placeholder="Search employees..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ mb: 3 }}
        InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
      />

      <Paper sx={{ p: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Job Title</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => (
                  <TableRow key={employee.employee_id}>
                    <TableCell>{employee.employee_number}</TableCell>
                    <TableCell>{`${employee.first_name} ${employee.last_name}`}</TableCell>
                    <TableCell>{employee.job_title}</TableCell>
                    <TableCell>{employee.department_name}</TableCell>
                    <TableCell>{getRoleChip(employee.role)}</TableCell>
                    <TableCell><Chip label={employee.status} color={getStatusColor(employee.status)} size="small" /></TableCell>
                    <TableCell>
                      <Button variant="outlined" size="small" onClick={() => router.push(`/admin/employees/edit/${employee.employee_id}`)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={7} align="center">No employees found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

// Wrap the page content in the Layout and ProtectedRoute
export default function EmployeesPage() {
    return (
        <ProtectedRoute>
            <Layout>
                <EmployeesPageContent />
            </Layout>
        </ProtectedRoute>
    )
}