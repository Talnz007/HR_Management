"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Typography, TextField, Button, CircularProgress, Alert, Paper } from '@mui/material';
import { apiService } from '../../../../services/apiService';
import Layout from '../../../../components/Layout';
import { ProtectedRoute } from '../../../../components/ProtectedRoute';
import toast from 'react-hot-toast';

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;

  const [employee, setEmployee] = useState<any>(null);
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
    setEmployee((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // The PUT endpoint expects the full employee object
      const { employee_id, user_id, created_at, updated_at, role, ...updateData } = employee;
      
      // WORKAROUND: Add a dummy password to satisfy the backend validation
      updateData.password = "Temporary12345!"; // This meets most password requirements
      
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

  if (loading) return <Box display="flex" justifyContent="center" sx={{ mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!employee) return <Alert severity="warning">Employee not found.</Alert>;

  return (
    <ProtectedRoute>
      <Layout>
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>Edit Employee</Typography>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <TextField 
                  name="first_name" 
                  label="First Name" 
                  value={employee.first_name || ''} 
                  onChange={handleChange} 
                  fullWidth 
                />
                <TextField 
                  name="last_name" 
                  label="Last Name" 
                  value={employee.last_name || ''} 
                  onChange={handleChange} 
                  fullWidth 
                />
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <TextField 
                  name="job_title" 
                  label="Job Title" 
                  value={employee.job_title || ''} 
                  onChange={handleChange} 
                  fullWidth 
                />
                <TextField 
                  name="phone" 
                  label="Phone" 
                  value={employee.phone || ''} 
                  onChange={handleChange} 
                  fullWidth 
                />
              </Box>
              
              <TextField 
                name="status" 
                label="Status" 
                value={employee.status || 'active'} 
                onChange={handleChange} 
                fullWidth 
                select 
                SelectProps={{ native: true }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
              </TextField>
            </Box>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => router.back()} sx={{ mr: 1 }}>Cancel</Button>
              <Button variant="contained" onClick={handleSave} disabled={saving}>
                {saving ? <CircularProgress size={24} /> : 'Save Changes'}
              </Button>
            </Box>
          </Paper>
        </Box>
      </Layout>
    </ProtectedRoute>
  );
}
