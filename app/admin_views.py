# admin_views.py

from sqladmin import ModelView
from app.models.user import User
from app.models.employee import Employee
from app.models.department import Department

class UserAdmin(ModelView, model=User):
    column_list = [User.user_id, User.email, User.created_at, User.is_active, User.last_login]  # Adjust fields

class EmployeeAdmin(ModelView, model=Employee):
    column_list = [Employee.employee_id, Employee.first_name, Employee.last_name,Employee.employment_type, Employee.department, Employee.attendances]

class DepartmentAdmin(ModelView, model=Department):
    column_list = [Department.department_id, Department.name]
