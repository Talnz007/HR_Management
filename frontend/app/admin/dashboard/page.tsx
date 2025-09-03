"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
// **FIX:** Change the Grid import to be more direct
import { Box, Typography, TextField, Button, CircularProgress, Alert, Paper } from '@mui/material';
import Grid from '@mui/material/Grid'; // <-- Use this direct import for Grid
import { apiService } from '../../services/apiService';
import Layout from '../../components/Layout';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import toast from 'react-hot-toast';

// A more specific type for the employee state
interface EmployeeData {
  first_name: string;
  last_name: string;
  job_title: string;
  phone: string;
  status: 'active' | 'inactive' | 'terminated';
  [key: string]: any; // Allow other properties
}

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;

  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employeeId) {
      apiService.getEmployee(employeeId)
        .then(data => {
          setEmployee(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch employee", err);
          setError("Failed to load employee data.");
          setLoading(false);
        });
    }
  }, [employeeId]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setEmployee((prev: EmployeeData | null) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleSave = async () => {
    if (!employee) return;
    setSaving(true);
    try {
      const { employee_id, user_id, created_at, updated_at, role, profile_picture_key, ...updateData } = employee;
      delete updateData.password;

      await apiService.updateEmployee(employeeId, updateData);
      toast.success("Employee updated successfully!");
      router.push('/admin/employees');
    } catch (err) {
      console.error("Failed to update employee", err);
      toast.error("Failed to update employee.");
    } finally {
      setSaving(false);
    }
  };

  const renderContent = () => {
    if (loading) return <Box display="flex" justifyContent="center" sx={{ mt: 4 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!employee) return <Alert severity="warning">Employee not found.</Alert>;

    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Edit Employee</Typography>
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField name="first_name" label="First Name" value={employee.first_name} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="last_name" label="Last Name" value={employee.last_name} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="job_title" label="Job Title" value={employee.job_title} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="phone" label="Phone" value={employee.phone} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12}>
               <TextField name="status" label="Status" value={employee.status} onChange={handleChange} fullWidth select SelectProps={{ native: true }}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="terminated">Terminated</option>
               </TextField>
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => router.back()} sx={{ mr: 1 }}>Cancel</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        {renderContent()}
      </Layout>
    </ProtectedRoute>
  );
}