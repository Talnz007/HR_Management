from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.api.deps import require_role
from app.database import get_db
from app.models.user import User
from app.models.employee import Employee
from app.models.leave import Leave
from app.models.attendance import Attendance
from app.models.payroll import Payroll
from app.schemas.employee import EmployeeCreate, EmployeeResponse
from app.schemas.leave import LeaveCreate, LeaveResponse
from app.schemas.attendance import AttendanceCreate, AttendanceResponse
from app.schemas.payroll import PayrollCreate, PayrollResponse
from app.core.security import get_password_hash
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["employees"])


@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(employee: EmployeeCreate, db: Session = Depends(get_db),
                    current_user: User = Depends(require_role(["admin"]))):
    """Create a new employee with a corresponding user (admin only)."""
    db_employee = db.query(Employee).filter(Employee.employee_number == employee.employee_number).first()
    if db_employee:
        logger.warning(f"Attempt to create employee with existing employee_number: {employee.employee_number}")
        raise HTTPException(status_code=400, detail="Employee number already exists")

    # Create a new User
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    username = f"{employee.employee_number}_{timestamp}"
    email = f"{employee.employee_number}@hrsystem.local"
    hashed_password = get_password_hash(employee.password)

    db_user = db.query(User).filter(User.username == username).first()
    if db_user:
        logger.error(f"Username {username} already exists")
        raise HTTPException(status_code=400, detail="Generated username already exists")
    db_email = db.query(User).filter(User.email == email).first()
    if db_email:
        logger.error(f"Email {email} already exists")
        raise HTTPException(status_code=400, detail="Generated email already exists")

    new_user = User(
        username=username,
        email=email,
        phone=employee.phone,
        password_hash=hashed_password,
        is_active=True,
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    logger.info(f"Created user {username} for employee {employee.employee_number}")

    employee_data = employee.model_dump(exclude={"password"})
    new_employee = Employee(**employee_data, user_id=new_user.user_id, created_at=datetime.now(timezone.utc))
    db.add(new_employee)
    try:
        db.commit()
        db.refresh(new_employee)
        logger.info(f"Created employee {employee.employee_number} with user_id {new_user.user_id}")
        return new_employee
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create employee {employee.employee_number}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create employee")


@router.get("/", response_model=List[EmployeeResponse])
def list_employees(db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    """List all employees (admin only)."""
    return db.query(Employee).all()


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: str, db: Session = Depends(get_db),
                 current_user: User = Depends(require_role(["admin"]))):
    """Get an employee by ID (admin only)."""
    try:
        employee = db.query(Employee).filter(Employee.employee_id == employee_id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        return employee
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")


@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(employee_id: str, employee: EmployeeCreate, db: Session = Depends(get_db),
                    current_user: User = Depends(require_role(["admin"]))):
    """Update an employee (admin only)."""
    try:
        db_employee = db.query(Employee).filter(Employee.employee_id == employee_id).first()
        if not db_employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        if employee.employee_number != db_employee.employee_number:
            if db.query(Employee).filter(Employee.employee_number == employee.employee_number).first():
                raise HTTPException(status_code=400, detail="Employee number already exists")
        employee_data = employee.model_dump(exclude={"password"})
        for key, value in employee_data.items():
            setattr(db_employee, key, value)
        db_employee.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(db_employee)
        logger.info(f"Updated employee {employee_id}")
        return db_employee
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_id: str, db: Session = Depends(get_db),
                    current_user: User = Depends(require_role(["admin"]))):
    """Delete an employee and associated user (admin only)."""
    try:
        db_employee = db.query(Employee).filter(Employee.employee_id == employee_id).first()
        if not db_employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        db_user = db.query(User).filter(User.user_id == db_employee.user_id).first()
        db.delete(db_employee)
        if db_user:
            db.delete(db_user)
        db.commit()
        logger.info(f"Deleted employee {employee_id} and user {db_employee.user_id}")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete employee {employee_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete employee")


@router.post("/leaves", response_model=LeaveResponse, status_code=status.HTTP_201_CREATED)
def create_leave(leave: LeaveCreate, db: Session = Depends(get_db),
                 current_user: User = Depends(require_role(["admin"]))):
    """Create a new leave (admin only)."""
    db_leave = Leave(**leave.model_dump(), created_at=datetime.now(timezone.utc))
    db.add(db_leave)
    try:
        db.commit()
        db.refresh(db_leave)
        logger.info(f"Created leave {db_leave.leave_id} for employee {leave.employee_id}")
        return db_leave
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create leave: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create leave")


@router.post("/attendances", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def create_attendance(attendance: AttendanceCreate, db: Session = Depends(get_db),
                      current_user: User = Depends(require_role(["admin"]))):
    """Create a new attendance record (admin only)."""
    db_attendance = Attendance(**attendance.model_dump(), created_at=datetime.now(timezone.utc))
    db.add(db_attendance)
    try:
        db.commit()
        db.refresh(db_attendance)
        logger.info(f"Created attendance {db_attendance.attendance_id} for employee {attendance.employee_id}")
        return db_attendance
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create attendance: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create attendance")


@router.post("/payrolls", response_model=PayrollResponse, status_code=status.HTTP_201_CREATED)
def create_payroll(payroll: PayrollCreate, db: Session = Depends(get_db),
                   current_user: User = Depends(require_role(["admin"]))):
    """Create a new payroll record (admin only)."""
    db_payroll = Payroll(**payroll.model_dump(), created_at=datetime.now(timezone.utc))
    db.add(db_payroll)
    try:
        db.commit()
        db.refresh(db_payroll)
        logger.info(f"Created payroll {db_payroll.payroll_id} for employee {payroll.employee_id}")
        return db_payroll
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create payroll: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create payroll")