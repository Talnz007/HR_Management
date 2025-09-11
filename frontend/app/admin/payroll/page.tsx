"use client"
import { useState, useEffect, useMemo } from "react"
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
  IconButton,
  CircularProgress,
  Skeleton,
  DialogContentText,
} from "@mui/material"
import { Add, Edit, Delete, GetApp } from "@mui/icons-material"
import { apiService } from "@/app/services/apiService"
import toast from "react-hot-toast"
import { ProtectedRoute } from "../../components/ProtectedRoute"
import Layout from "../../components/Layout"
// --- FIX: Import autoTable as a direct function ---
import jsPDF from "jspdf"
import autoTable from 'jspdf-autotable'

// Interfaces for our data structures
interface Employee {
  employee_id: string;
  first_name: string;
  last_name: string;
  salary?: number | null; 
}

interface Payroll {
  payroll_id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  base_salary: number;
  overtime_pay?: number | null;
  deductions?: number | null;
  net_pay: number;
  created_at: string;
}

// A type for our form data
type PayrollFormData = Omit<Payroll, "payroll_id" | "created_at">;

function PayrollManagement() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [payrollToDelete, setPayrollToDelete] = useState<Payroll | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [payrollsData, employeesData] = await Promise.all([
        apiService.getPayrolls(),
        apiService.getEmployees(),
      ]);
      setPayrolls(payrollsData);
      setEmployees(employeesData);
    } catch (error) {
      toast.error("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const employeeMap = useMemo(() => {
    return new Map(employees.map(emp => [emp.employee_id, `${emp.first_name} ${emp.last_name}`]));
  }, [employees]);

  const handleOpenCreateDialog = () => {
    setEditingPayroll(null);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (payroll: Payroll) => {
    setEditingPayroll(payroll);
    setDialogOpen(true);
  };
  
  const handleOpenDeleteDialog = (payroll: Payroll) => {
    setPayrollToDelete(payroll);
    setDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPayroll(null);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setPayrollToDelete(null);
  };

  const handleSave = async (formData: PayrollFormData) => {
    try {
      if (editingPayroll) {
        await apiService.updatePayroll(editingPayroll.payroll_id, formData);
        toast.success("Payroll updated successfully");
      } else {
        await apiService.createPayroll(formData);
        toast.success("Payroll created successfully");
      }
      handleCloseDialog();
      fetchData();
    } catch (error) {
      toast.error(`Failed to ${editingPayroll ? 'update' : 'create'} payroll.`);
    }
  };
  
  const handleDelete = async () => {
    if (!payrollToDelete) return;
    try {
      await apiService.deletePayroll(payrollToDelete.payroll_id);
      toast.success("Payroll record deleted successfully");
      handleCloseDeleteDialog();
      fetchData();
    } catch (error) {
      toast.error("Failed to delete payroll record.");
    }
  };

  // --- FIX: Use autoTable as a function ---
  const handleDownloadPayslip = (payroll: Payroll) => {
    try {
      const employeeName = employeeMap.get(payroll.employee_id) || 'Unknown Employee';
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text("Payslip", 105, 20, { align: "center" });
      
      doc.setFontSize(12);
      doc.text(`Employee: ${employeeName}`, 14, 30);
      doc.text(`Payroll Period: ${new Date(payroll.period_start).toLocaleDateString()} - ${new Date(payroll.period_end).toLocaleDateString()}`, 14, 38);

      // Call autoTable as a function, passing the doc object
      autoTable(doc, {
          startY: 45,
          head: [['Earnings', 'Amount (USD)']],
          body: [
              ['Base Salary', `$${payroll.base_salary.toLocaleString()}`],
              ['Overtime Pay', `$${(payroll.overtime_pay || 0).toLocaleString()}`],
          ],
          theme: 'striped',
          headStyles: { fillColor: [22, 163, 74] },
      });

      // Get the end position from the previous table
      let finalY = (doc as any).lastAutoTable.finalY;

      autoTable(doc, {
          startY: finalY + 10,
          head: [['Deductions', 'Amount (USD)']],
          body: [
              ['Deductions', `-$${(payroll.deductions || 0).toLocaleString()}`],
          ],
          theme: 'striped',
          headStyles: { fillColor: [220, 38, 38] },
      });
      
      finalY = (doc as any).lastAutoTable.finalY;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Net Pay: $${payroll.net_pay.toLocaleString()}`, 14, finalY + 15);

      const periodEnd = new Date(payroll.period_end).toISOString().split('T')[0];
      doc.save(`Payslip-${employeeName.replace(/\s/g, '_')}-${periodEnd}.pdf`);
      
      toast.success("Payslip download initiated!");

    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error("Could not download payslip. See console for details.");
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Payroll Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreateDialog}>
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
              <TableCell>Overtime</TableCell>
              <TableCell>Deductions</TableCell>
              <TableCell>Net Pay</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from(new Array(5)).map((_, index) => (
                <TableRow key={index}>
                  {[...Array(7)].map((_, i) => <TableCell key={i}><Skeleton /></TableCell>)}
                </TableRow>
              ))
            ) : payrolls.length > 0 ? (
              payrolls.map((payroll) => (
                <TableRow key={payroll.payroll_id}>
                  <TableCell>{employeeMap.get(payroll.employee_id) || "Unknown Employee"}</TableCell>
                  <TableCell>
                    {new Date(payroll.period_start).toLocaleDateString()} -{" "}
                    {new Date(payroll.period_end).toLocaleDateString()}
                  </TableCell>
                  <TableCell>${payroll.base_salary.toLocaleString()}</TableCell>
                  <TableCell>${(payroll.overtime_pay || 0).toLocaleString()}</TableCell>
                  <TableCell>${(payroll.deductions || 0).toLocaleString()}</TableCell>
                  <TableCell>${payroll.net_pay.toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenEditDialog(payroll)}><Edit /></IconButton>
                    <IconButton size="small" onClick={() => handleOpenDeleteDialog(payroll)}><Delete /></IconButton>
                    <IconButton size="small" onClick={() => handleDownloadPayslip(payroll)}><GetApp /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No payroll records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {dialogOpen && (
        <PayrollDialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          onSave={handleSave}
          employees={employees}
          payroll={editingPayroll}
        />
      )}

      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the payroll record for{" "}
            <strong>{payrollToDelete ? employeeMap.get(payrollToDelete.employee_id) : ""}</strong>? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function PayrollDialog({ open, onClose, onSave, employees, payroll }: {
  open: boolean;
  onClose: () => void;
  onSave: (data: PayrollFormData) => Promise<void>;
  employees: Employee[];
  payroll: Payroll | null;
}) {
  const [formData, setFormData] = useState<any>({
    employee_id: payroll?.employee_id || "",
    period_start: payroll ? new Date(payroll.period_start).toISOString().split('T')[0] : "",
    period_end: payroll ? new Date(payroll.period_end).toISOString().split('T')[0] : "",
    base_salary: payroll?.base_salary || "",
    overtime_pay: payroll?.overtime_pay || "",
    deductions: payroll?.deductions || "",
    net_pay: payroll?.net_pay || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!payroll && formData.employee_id) {
      const fetchEmployeeSalary = async () => {
        try {
          const employeeDetails: Employee = await apiService.getEmployee(formData.employee_id);
          if (employeeDetails.salary != null) {
            setFormData((prev: any) => ({ ...prev, base_salary: employeeDetails.salary!.toString() }));
          } else {
            setFormData((prev: any) => ({ ...prev, base_salary: '' }));
            toast.error("Selected employee does not have a salary set.");
          }
        } catch (error) {
          toast.error("Could not fetch employee's salary.");
        }
      };
      fetchEmployeeSalary();
    }
  }, [formData.employee_id, payroll]);

  useEffect(() => {
    const base = Number.parseFloat(formData.base_salary) || 0;
    const overtime = Number.parseFloat(formData.overtime_pay) || 0;
    const deductions = Number.parseFloat(formData.deductions) || 0;
    setFormData((prev: any) => ({ ...prev, net_pay: (base + overtime - deductions).toString() }));
  }, [formData.base_salary, formData.overtime_pay, formData.deductions]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const name = e.target.name as keyof typeof formData;
    const value = e.target.value;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    const submitData = {
      ...formData,
      base_salary: Number.parseFloat(formData.base_salary),
      overtime_pay: formData.overtime_pay ? Number.parseFloat(formData.overtime_pay) : null,
      deductions: formData.deductions ? Number.parseFloat(formData.deductions) : null,
      net_pay: Number.parseFloat(formData.net_pay),
    };
    await onSave(submitData);
    setIsSaving(false);
  };
  
  return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{payroll ? "Edit" : "Generate"} Payroll</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField name="employee_id" select fullWidth label="Employee" value={formData.employee_id} onChange={handleChange} disabled={!!payroll}>
                {employees.map((employee) => (
                  <MenuItem key={employee.employee_id} value={employee.employee_id}>
                    {`${employee.first_name} ${employee.last_name}`}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="period_start" fullWidth label="Period Start" type="date" InputLabelProps={{ shrink: true }} value={formData.period_start} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="period_end" fullWidth label="Period End" type="date" InputLabelProps={{ shrink: true }} value={formData.period_end} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="base_salary" fullWidth label="Base Salary" type="number" value={formData.base_salary} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="overtime_pay" fullWidth label="Overtime Pay" type="number" value={formData.overtime_pay} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="deductions" fullWidth label="Deductions" type="number" value={formData.deductions} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="net_pay" fullWidth label="Net Pay" type="number" value={formData.net_pay} InputProps={{ readOnly: true }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={isSaving}>
            {isSaving ? <CircularProgress size={24} /> : (payroll ? "Save Changes" : "Generate")}
          </Button>
        </DialogActions>
      </Dialog>
  )
}

export default function PayrollManagementPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <PayrollManagement />
      </Layout>
    </ProtectedRoute>
  );
}
