from sqlalchemy.orm import Session
from app.models.employee import Employee
from app.models.department import Department
from app.models.admin import Admin
import logging

logger = logging.getLogger(__name__)


def is_admin(user_payload: dict, db: Session) -> bool:
    """Check if the current user is an admin"""
    user_id = user_payload.get("user_id")
    return db.query(Admin).filter(Admin.user_id == user_id).first() is not None


def is_department_manager(user_payload: dict, department_id: str, db: Session) -> bool:
    """Check if the current user is a manager of the specified department"""
    user_id = user_payload.get("user_id")

    # Get the employee associated with this user
    employee = db.query(Employee).filter(Employee.user_id == user_id).first()
    if not employee:
        return False

    # Check if this employee is the manager of the department
    department = db.query(Department).filter(
        Department.department_id == department_id,
        Department.manager_id == employee.employee_id
    ).first()

    return department is not None


def get_accessible_departments(user_payload: dict, db: Session):
    """Get departments accessible to the current user"""
    user_id = user_payload.get("user_id")

    # Admins can access all departments
    if is_admin(user_payload, db):
        departments = db.query(Department).all()
        return departments

    # Get the employee associated with this user
    employee = db.query(Employee).filter(Employee.user_id == user_id).first()
    if not employee:
        return []

    # Get departments where this employee is the manager
    departments = db.query(Department).filter(Department.manager_id == employee.employee_id).all()
    return departments


def get_accessible_department_ids(user_payload: dict, db: Session):
    """Get department IDs accessible to the current user"""
    departments = get_accessible_departments(user_payload, db)
    return [dept.department_id for dept in departments]


def filter_employees_by_department_access(query, user_payload: dict, db: Session):
    """Filter an employee query to only include employees from accessible departments"""
    # Admins can see all employees
    if is_admin(user_payload, db):
        return query

    # Get departments managed by this user
    accessible_dept_ids = get_accessible_department_ids(user_payload, db)
    if not accessible_dept_ids:
        return query.filter(False)  # Return empty result if no departments are accessible

    # Filter to only include employees from accessible departments
    return query.filter(Employee.department_id.in_(accessible_dept_ids))