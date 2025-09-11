from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app.models.department import Department
from app.models.employee import Employee
from app.models.admin import Admin
from app.schemas.department import (
    DepartmentResponse, DepartmentCreate, DepartmentUpdate,
    DepartmentWithManager
)
from app.api.deps import get_current_user, require_role
from app.utils.access_control import get_accessible_departments
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["departments"])


@router.get("/", response_model=List[DepartmentWithManager])
def list_departments(
        db: Session = Depends(get_db),
        current_user: dict = Depends(get_current_user)
):
    """List departments accessible to the current user."""
    # Get departments accessible to this user
    departments = get_accessible_departments(current_user, db)

    # Load the manager relationship for each department
    result = []
    for dept in departments:
        # Manually load the manager to create a proper response
        if dept.manager_id:
            manager = db.query(Employee).filter(Employee.employee_id == dept.manager_id).first()
            dept.manager = manager
        result.append(dept)

    return result


@router.get("/{department_id}", response_model=DepartmentWithManager)
def get_department(
        department_id: str,
        db: Session = Depends(get_db),
        current_user: dict = Depends(get_current_user)
):
    """Get department details by ID."""
    # Check if user has access to this department
    accessible_dept_ids = [d.department_id for d in get_accessible_departments(current_user, db)]

    if str(department_id) not in [str(d) for d in accessible_dept_ids]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this department"
        )

    # Get department with manager details
    department = db.query(Department).filter(Department.department_id == department_id).first()
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )

    # Load the manager if available
    if department.manager_id:
        manager = db.query(Employee).filter(Employee.employee_id == department.manager_id).first()
        department.manager = manager

    return department


@router.post("/", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
        department: DepartmentCreate,
        db: Session = Depends(get_db),
        current_user: dict = Depends(require_role(["admin"]))
):
    """Create a new department (admin only)."""
    # Check if department with this name already exists
    existing = db.query(Department).filter(Department.name == department.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department with this name already exists"
        )

    # Create the department
    new_department = Department(name=department.name)
    db.add(new_department)
    db.commit()
    db.refresh(new_department)

    return new_department


@router.put("/{department_id}", response_model=DepartmentWithManager)
def update_department(
        department_id: str,
        department_update: DepartmentUpdate,
        db: Session = Depends(get_db),
        current_user: dict = Depends(require_role(["admin"]))
):
    """Update a department, including assigning a manager (admin only)."""
    # Get the department
    department = db.query(Department).filter(Department.department_id == department_id).first()
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )

    # If updating name, check for duplicates
    if department_update.name and department_update.name != department.name:
        existing = db.query(Department).filter(Department.name == department_update.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Department with this name already exists"
            )
        department.name = department_update.name

    # If assigning a manager, verify the employee exists
    if department_update.manager_id is not None:
        if department_update.manager_id:  # Not None but has a value
            manager = db.query(Employee).filter(Employee.employee_id == department_update.manager_id).first()
            if not manager:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Employee not found for manager assignment"
                )
        # Assign the manager (or set to None if removing)
        department.manager_id = department_update.manager_id

    db.commit()
    db.refresh(department)

    # Load the manager for the response
    if department.manager_id:
        manager = db.query(Employee).filter(Employee.employee_id == department.manager_id).first()
        department.manager = manager

    return department


@router.delete("/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(
        department_id: str,
        db: Session = Depends(get_db),
        current_user: dict = Depends(require_role(["admin"]))
):
    """Delete a department (admin only)."""
    # Get the department
    department = db.query(Department).filter(Department.department_id == department_id).first()
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )

    # Check if there are employees in this department
    employees_count = db.query(Employee).filter(Employee.department_id == department_id).count()
    if employees_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete department that has {employees_count} employees. Reassign employees first."
        )

    # Delete the department
    db.delete(department)
    db.commit()