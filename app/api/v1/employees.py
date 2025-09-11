from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.api.deps import require_role
from app.database import get_db
from app.models.user import User
from app.models.employee import Employee
from app.schemas.employee import EmployeeCreate, EmployeeResponse, EmployeeRoleUpdate
from app.schemas.user import UserResponse, UserRole
from app.core.security import get_password_hash
from datetime import datetime, timezone
import logging
from app.api.deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(tags=["employees"])


# Update the list_employees function to filter by department access
@router.get("/", response_model=List[EmployeeResponse])
def list_employees(
        db: Session = Depends(get_db),
        current_user: dict = Depends(get_current_user),
        skip: int = 0,
        limit: int = 100
):
    """List employees with access control based on user role."""
    from app.utils.access_control import filter_employees_by_department_access, is_admin

    # Start with a base query that loads the user relationship
    query = db.query(Employee).options(joinedload(Employee.user))

    # Apply department access filtering
    query = filter_employees_by_department_access(query, current_user, db)

    # Apply pagination
    employees = query.offset(skip).limit(limit).all()

    response_list = []
    for emp in employees:
        if emp.user:
            emp_response = EmployeeResponse.model_validate(emp)
            emp_response.role = emp.user.role
            response_list.append(emp_response)

    return response_list


# Similarly update the get_employee endpoint to check department access
@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(
        employee_id: str,
        db: Session = Depends(get_db),
        current_user: dict = Depends(get_current_user)
):
    """Get an employee by ID with access control."""
    from app.utils.access_control import is_admin, get_accessible_department_ids

    # Get the employee with their user data
    employee = db.query(Employee).options(joinedload(Employee.user)).filter(Employee.employee_id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    if not employee.user:
        raise HTTPException(status_code=404, detail="Associated user account not found for this employee")

    # Check if user has access to this employee's department
    is_user_admin = is_admin(current_user, db)
    accessible_dept_ids = get_accessible_department_ids(current_user, db)

    if not is_user_admin and str(employee.department_id) not in [str(d) for d in accessible_dept_ids]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this employee's data"
        )

    # Prepare the response
    emp_response = EmployeeResponse.model_validate(employee)
    emp_response.role = employee.user.role
    return emp_response

# --- Other endpoints (create, update, delete, update_role) ---
# The other endpoints you provided are mostly correct, but let's ensure they
# also follow this safe response-building pattern.

@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(employee: EmployeeCreate, db: Session = Depends(get_db),
                    current_user_payload: dict = Depends(require_role(["admin"]))):
    # (Code for creating user and employee is correct)
    # ...
    db_employee = db.query(Employee).filter(Employee.employee_number == employee.employee_number).first()
    if db_employee:
        raise HTTPException(status_code=400, detail="Employee number already exists")

    username = employee.employee_number
    email = f"{username.lower()}@hrsystem.local"

    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    new_user = User(
        username=username,
        email=email,
        phone=employee.phone,
        password_hash=get_password_hash(employee.password),
        role="employee",
        is_active=True,
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_user)
    db.flush()

    employee_data = employee.model_dump(exclude={"password"})
    new_employee = Employee(**employee_data, user_id=new_user.user_id, created_at=datetime.now(timezone.utc))
    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)

    # **FIX:** Use the safe response pattern
    emp_response = EmployeeResponse.model_validate(new_employee)
    emp_response.role = new_user.role
    return emp_response


@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(employee_id: str, employee_update: EmployeeCreate, db: Session = Depends(get_db),
                    current_user_payload: dict = Depends(require_role(["admin"]))):
    # (Code for updating employee is correct)
    # ...
    db_employee = db.query(Employee).options(joinedload(Employee.user)).filter(Employee.employee_id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    if employee_update.employee_number != db_employee.employee_number:
        if db.query(Employee).filter(Employee.employee_number == employee_update.employee_number).first():
            raise HTTPException(status_code=400, detail="Employee number already exists")

    update_data = employee_update.model_dump(exclude_unset=True, exclude={"password"})
    for key, value in update_data.items():
        setattr(db_employee, key, value)
    
    db_employee.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_employee)

    # **FIX:** Use the safe response pattern
    emp_response = EmployeeResponse.model_validate(db_employee)
    emp_response.role = db_employee.user.role # Role comes from the joined user
    return emp_response


@router.put("/{employee_id}/role", response_model=UserResponse, summary="Update Employee Role")
def update_employee_role(
    employee_id: str,
    role_update: EmployeeRoleUpdate,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(require_role(["admin"])),
):
    # This endpoint was already correct as it returns a UserResponse, not an EmployeeResponse.
    employee = db.query(Employee).filter(Employee.employee_id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    user = db.query(User).filter(User.user_id == employee.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Associated user account not found")

    is_last_admin = (
        db.query(User).filter(User.role == UserRole.admin).count() == 1 and
        user.role == UserRole.admin
    )
    if is_last_admin and role_update.role != UserRole.admin:
        raise HTTPException(status_code=400, detail="Cannot remove the last admin role.")

    user.role = role_update.role
    db.commit()
    db.refresh(user)
    logger.info(f"Updated role for user {user.username} to {user.role.value}")
    return user


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_id: str, db: Session = Depends(get_db),
                    current_user_payload: dict = Depends(require_role(["admin"]))):
    # This endpoint is correct as it doesn't return a body.
    db_employee = db.query(Employee).options(joinedload(Employee.user)).filter(Employee.employee_id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    if db_employee.user and db_employee.user.role == UserRole.admin:
        if db.query(User).filter(User.role == UserRole.admin).count() <= 1:
            raise HTTPException(status_code=400, detail="Cannot delete the last admin user.")

    db_user = db.query(User).filter(User.user_id == db_employee.user_id).first()
    if db_user:
        db.delete(db_user)
    
    db.delete(db_employee)
    db.commit()
    logger.info(f"Deleted employee {employee_id} and user {db_employee.user_id}")
