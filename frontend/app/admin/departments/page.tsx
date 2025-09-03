"use client";

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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  IconButton
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { apiService } from "../../services/apiService";
import toast from "react-hot-toast";

interface Department {
  department_id: string;
  name: string;
  manager_id: string | null;
  manager_name?: string;
  created_at: string;
  updated_at: string | null;
}

interface Employee {
  employee_id: string;
  first_name: string;
  last_name: string;
  is_manager: boolean;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [newDepartment, setNewDepartment] = useState<{ name: string, manager_id: string | null }>({
    name: "",
    manager_id: null
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch departments and managers data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [deptsData, employeesData] = await Promise.all([
          apiService.getDepartments(),
          apiService.getEmployees()
        ]);

        // Filter employees to get managers
        const managersList = employeesData.filter((emp: any) =>
          emp.role === "manager" || employeesData.some((e: any) => e.manager_id === emp.employee_id)
        );

        // Create a map of manager IDs to names
        const managerMap = new Map();
        managersList.forEach((manager: any) => {
          managerMap.set(manager.employee_id, `${manager.first_name} ${manager.last_name}`);
        });

        // Enhance department data with manager names
        const enhancedDepartments = deptsData.map((dept: any) => ({
          ...dept,
          manager_name: dept.manager_id ? managerMap.get(dept.manager_id) || "Unknown" : "None"
        }));

        setDepartments(enhancedDepartments);
        setManagers(managersList);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load departments data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleOpenDialog = (department: Department | null = null) => {
    if (department) {
      setEditingDepartment(department);
      setNewDepartment({
        name: department.name,
        manager_id: department.manager_id
      });
    } else {
      setEditingDepartment(null);
      setNewDepartment({
        name: "",
        manager_id: null
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setNewDepartment(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  const handleSaveDepartment = async () => {
    try {
      if (!newDepartment.name) {
        toast.error("Department name is required");
        return;
      }

      let updatedDept;
      if (editingDepartment) {
        // Update existing department
        updatedDept = await apiService.updateDepartment(
          editingDepartment.department_id,
          newDepartment
        );

        setDepartments(departments.map(dept =>
          dept.department_id === editingDepartment.department_id ?
            {
              ...updatedDept,
              manager_name: newDepartment.manager_id ?
                managers.find(m => m.employee_id === newDepartment.manager_id)?.first_name + ' ' +
                managers.find(m => m.employee_id === newDepartment.manager_id)?.last_name :
                "None"
            } :
            dept
        ));

        toast.success("Department updated successfully");
      } else {
        // Create new department
        updatedDept = await apiService.createDepartment(newDepartment);

        setDepartments([...departments, {
          ...updatedDept,
          manager_name: newDepartment.manager_id ?
            managers.find(m => m.employee_id === newDepartment.manager_id)?.first_name + ' ' +
            managers.find(m => m.employee_id === newDepartment.manager_id)?.last_name :
            "None"
        }]);

        toast.success("Department created successfully");
      }

      handleCloseDialog();
    } catch (err) {
      console.error("Error saving department:", err);
      toast.error("Failed to save department");
    }
  };

  const handleDeleteDepartment = async (departmentId: string) => {
    if (window.confirm("Are you sure you want to delete this department?")) {
      try {
        await apiService.deleteDepartment(departmentId);
        setDepartments(departments.filter(dept => dept.department_id !== departmentId));
        toast.success("Department deleted successfully");
      } catch (err) {
        console.error("Error deleting department:", err);
        toast.error("Failed to delete department");
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Departments</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Department
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Manager</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {departments.length > 0 ? (
                departments.map((department) => (
                  <TableRow key={department.department_id}>
                    <TableCell>{department.name}</TableCell>
                    <TableCell>{department.manager_name || "None"}</TableCell>
                    <TableCell>{new Date(department.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {department.updated_at ? new Date(department.updated_at).toLocaleDateString() : "Never"}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(department)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteDepartment(department.department_id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">No departments found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Department Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>{editingDepartment ? "Edit Department" : "Add New Department"}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Department Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newDepartment.name}
            onChange={handleChange}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Department Manager</InputLabel>
            <Select
              name="manager_id"
              value={newDepartment.manager_id || ""}
              onChange={handleChange}
              label="Department Manager"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {managers.map((manager) => (
                <MenuItem key={manager.employee_id} value={manager.employee_id}>
                  {`${manager.first_name} ${manager.last_name}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveDepartment} variant="contained">
            {editingDepartment ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}