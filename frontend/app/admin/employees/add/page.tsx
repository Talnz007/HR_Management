"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  CircularProgress, 
  Alert, 
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';
import { apiService } from '../../../services/apiService';
import Layout from '../../../components/Layout';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import toast from 'react-hot-toast';

interface Department {
  department_id: string;
  name: string;
}

interface Manager {
  employee_id: string;
  first_name: string;
  last_name: string;
}

interface EmployeeFormData {
  employee_number: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  date_of_birth: Date | null;
  phone: string;
  hire_date: Date | null;
  job_title: string;
  department_id: string;
  manager_id: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'intern';
  status: 'active' | 'inactive' | 'terminated';
  salary: number | '';
  password: string;
}

export default function AddEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loadingDependencies, setLoadingDependencies] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState<EmployeeFormData>({
    employee_number: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    date_of_birth: null,
    phone: '',
    hire_date: new Date(),
    job_title: '',
    department_id: '',
    manager_id: '',
    employment_type: 'full_time',
    status: 'active',
    salary: '',
    password: ''
  });

  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const [deptData, empData] = await Promise.all([
          apiService.getDepartments(),
          apiService.getEmployees()
        ]);
        setDepartments(deptData);
        
        // Filter employees who could be managers (typically, those with a manager role)
        const potentialManagers = empData.filter((emp: any) => 
          emp.role === 'manager' || emp.role === 'admin'
        );
        setManagers(potentialManagers);
      } catch (err) {
        console.error("Error fetching dependencies:", err);
        toast.error("Failed to load departments or managers");
      } finally {
        setLoadingDependencies(false);
      }
    };

    fetchDependencies();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.employee_number) newErrors.employee_number = "Employee number is required";
    if (!formData.first_name) newErrors.first_name = "First name is required";
    if (!formData.last_name) newErrors.last_name = "Last name is required";
    if (!formData.date_of_birth) newErrors.date_of_birth = "Date of birth is required";
    if (!formData.phone) newErrors.phone = "Phone number is required";
    if (!formData.hire_date) newErrors.hire_date = "Hire date is required";
    if (!formData.job_title) newErrors.job_title = "Job title is required";
    if (!formData.department_id) newErrors.department_id = "Department is required";
    if (!formData.employment_type) newErrors.employment_type = "Employment type is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password && formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
    
    // Clear error for this field if it exists
    if (errors[name as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as string];
        return newErrors;
      });
    }
  };

  const handleDateChange = (name: string) => (date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        date_of_birth: formData.date_of_birth ? formData.date_of_birth.toISOString().split('T')[0] : null,
        hire_date: formData.hire_date ? formData.hire_date.toISOString().split('T')[0] : null,
        salary: formData.salary !== '' ? Number(formData.salary) : null,
        // If manager_id is empty, set it to null
        manager_id: formData.manager_id || null
      };

      await apiService.createEmployee(payload);
      toast.success("Employee created successfully!");
      router.push('/admin/employees');
    } catch (error) {
      console.error('Error creating employee:', error);
      toast.error("Failed to create employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>Add New Employee</Typography>
          
          {loadingDependencies ? (
            <Box display="flex" justifyContent="center" sx={{ mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Paper sx={{ p: 3 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Basic Information */}
                  <Typography variant="h6">Basic Information</Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <TextField
                      name="employee_number"
                      label="Employee Number *"
                      value={formData.employee_number}
                      onChange={handleChange}
                      fullWidth
                      error={!!errors.employee_number}
                      helperText={errors.employee_number}
                    />
                    
                    <TextField
                      name="first_name"
                      label="First Name *"
                      value={formData.first_name}
                      onChange={handleChange}
                      fullWidth
                      error={!!errors.first_name}
                      helperText={errors.first_name}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <TextField
                      name="last_name"
                      label="Last Name *"
                      value={formData.last_name}
                      onChange={handleChange}
                      fullWidth
                      error={!!errors.last_name}
                      helperText={errors.last_name}
                    />
                    
                    <TextField
                      name="middle_name"
                      label="Middle Name"
                      value={formData.middle_name}
                      onChange={handleChange}
                      fullWidth
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <Box sx={{ width: '100%' }}>
                      <DatePicker
                        label="Date of Birth *"
                        value={formData.date_of_birth}
                        onChange={handleDateChange('date_of_birth')}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors.date_of_birth,
                            helperText: errors.date_of_birth
                          }
                        }}
                      />
                    </Box>
                    
                    <TextField
                      name="phone"
                      label="Phone Number *"
                      value={formData.phone}
                      onChange={handleChange}
                      fullWidth
                      error={!!errors.phone}
                      helperText={errors.phone}
                    />
                  </Box>
                  
                  {/* Employment Information */}
                  <Typography variant="h6" sx={{ mt: 2 }}>Employment Information</Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <Box sx={{ width: '100%' }}>
                      <DatePicker
                        label="Hire Date *"
                        value={formData.hire_date}
                        onChange={handleDateChange('hire_date')}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors.hire_date,
                            helperText: errors.hire_date
                          }
                        }}
                      />
                    </Box>
                    
                    <TextField
                      name="job_title"
                      label="Job Title *"
                      value={formData.job_title}
                      onChange={handleChange}
                      fullWidth
                      error={!!errors.job_title}
                      helperText={errors.job_title}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <FormControl fullWidth error={!!errors.department_id}>
                      <InputLabel>Department *</InputLabel>
                      <Select
                        name="department_id"
                        value={formData.department_id}
                        label="Department *"
                        onChange={handleChange}
                      >
                        {departments.map((dept) => (
                          <MenuItem key={dept.department_id} value={dept.department_id}>
                            {dept.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.department_id && <FormHelperText>{errors.department_id}</FormHelperText>}
                    </FormControl>
                    
                    <FormControl fullWidth>
                      <InputLabel>Manager</InputLabel>
                      <Select
                        name="manager_id"
                        value={formData.manager_id}
                        label="Manager"
                        onChange={handleChange}
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {managers.map((manager) => (
                          <MenuItem key={manager.employee_id} value={manager.employee_id}>
                            {manager.first_name} {manager.last_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <FormControl fullWidth error={!!errors.employment_type}>
                      <InputLabel>Employment Type *</InputLabel>
                      <Select
                        name="employment_type"
                        value={formData.employment_type}
                        label="Employment Type *"
                        onChange={handleChange}
                      >
                        <MenuItem value="full_time">Full Time</MenuItem>
                        <MenuItem value="part_time">Part Time</MenuItem>
                        <MenuItem value="contract">Contract</MenuItem>
                        <MenuItem value="intern">Intern</MenuItem>
                      </Select>
                      {errors.employment_type && <FormHelperText>{errors.employment_type}</FormHelperText>}
                    </FormControl>
                    
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        name="status"
                        value={formData.status}
                        label="Status"
                        onChange={handleChange}
                      >
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                        <MenuItem value="terminated">Terminated</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <TextField
                      name="salary"
                      label="Salary"
                      type="number"
                      value={formData.salary}
                      onChange={handleChange}
                      fullWidth
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                    
                    <TextField
                      name="password"
                      label="Initial Password *"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      fullWidth
                      error={!!errors.password}
                      helperText={errors.password || "Min. 8 characters"}
                    />
                  </Box>
                </Box>
              </LocalizationProvider>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={() => router.back()} sx={{ mr: 1 }}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : "Create Employee"}
                </Button>
              </Box>
            </Paper>
          )}
        </Box>
      </Layout>
    </ProtectedRoute>
  );
}
