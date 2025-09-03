# admin_views.py

from sqladmin import ModelView
from app.models.user import User
from app.models.employee import Employee
from app.models.department import Department
from app.models.payroll import Payroll
from app.models.leave import Leave

class UserAdmin(ModelView, model=User):
    name = "User"
    name_plural = "Users"
    icon = "fa-solid fa-user"
    page_size = 25
    page_size_options = [10, 25, 50, 100, 200]
    column_list = [User.user_id, User.email, User.username, User.created_at, User.is_active, User.last_login, User.role]
    column_searchable_list = [User.email, User.username, User.phone]
    column_sortable_list = [User.user_id, User.email, User.username, User.created_at, User.is_active, User.last_login]
    form_columns = [User.email, User.username, User.phone, User.is_active, User.role]
    edit_columns = [User.email, User.username, User.phone, User.is_active, User.password_hash, User.role]
    export_types = ['csv', 'json']

class EmployeeAdmin(ModelView, model=Employee):
    name = "Employee"
    name_plural = "Employees"
    icon = "fa-solid fa-users"
    page_size = 25
    page_size_options = [10, 25, 50, 100, 200]
    column_list = [Employee.employee_id, Employee.employee_number, Employee.first_name, Employee.last_name,
                  Employee.job_title, Employee.employment_type, Employee.department_id, Employee.status]
    column_searchable_list = [Employee.first_name, Employee.last_name, Employee.employee_number, Employee.job_title]
    column_sortable_list = [Employee.employee_id, Employee.first_name, Employee.last_name,
                           Employee.employment_type, Employee.hire_date, Employee.status, Employee.employee_number, Employee.department_id]
    export_types = ['csv', 'json']

class DepartmentAdmin(ModelView, model=Department):
    name = "Department"
    name_plural = "Departments"
    icon = "fa-solid fa-building"
    page_size = 25
    page_size_options = [10, 25, 50, 100, 200]
    column_list = [Department.department_id, Department.name, Department.created_at]
    column_searchable_list = [Department.name]
    column_sortable_list = [Department.department_id, Department.name, Department.created_at]
    export_types = ['csv', 'json']

class PayrollAdmin(ModelView, model=Payroll):
    name = "Payroll"
    name_plural = "Payrolls"
    icon = "fa-solid fa-money-bill"
    page_size = 25
    page_size_options = [10, 25, 50, 100, 200]
    column_list = [Payroll.payroll_id, Payroll.employee_id, Payroll.period_start,
                  Payroll.period_end, Payroll.base_salary, Payroll.overtime_pay,
                  Payroll.deductions, Payroll.net_pay]
    column_searchable_list = [Payroll.employee_id, Payroll.net_pay]
    column_sortable_list = [Payroll.payroll_id, Payroll.employee_id, Payroll.period_start,
                           Payroll.period_end, Payroll.net_pay, Payroll.base_salary]
    form_columns = [Payroll.employee_id, Payroll.period_start, Payroll.period_end,
                   Payroll.base_salary, Payroll.overtime_pay, Payroll.deductions, Payroll.net_pay]
    export_types = ['csv', 'json']
    column_formatters = {
        Payroll.net_pay: lambda m, a: f"${m.net_pay:,.2f}"
    }

class LeaveAdmin(ModelView, model=Leave):
    name = "Leave"
    name_plural = "Leaves"
    icon = "fa-solid fa-calendar"
    page_size = 25
    page_size_options = [10, 25, 50, 100, 200]
    column_list = [Leave.leave_id, Leave.employee_id, Leave.leave_type,
                  Leave.start_date, Leave.end_date, Leave.status]
    column_searchable_list = [Leave.employee_id, Leave.leave_type, Leave.status]
    column_sortable_list = [Leave.leave_id, Leave.employee_id, Leave.start_date,
                           Leave.end_date, Leave.status]
    export_types = ['csv', 'json']