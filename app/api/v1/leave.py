from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.api.deps import require_role, get_current_user, get_current_employee
from app.database import get_db
from app.models.user import User
from app.models.employee import Employee
from app.models.leave import Leave
from app.schemas.leave import LeaveCreate, LeaveUpdate, LeaveResponse
from datetime import datetime, timezone

import logging
logger = logging.getLogger(__name__)

router = APIRouter(tags=["leave"])

@router.get("/self", response_model=List[LeaveResponse])
def get_leaves_self(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Get the current user's leave requests."""
    logger.info(f"get_leaves_self called with current_user: {current_user}")
    employee = db.query(Employee).filter(Employee.user_id == current_user.get("user_id")).first()
    if not employee:
        logger.error(f"Employee not found for user_id: {current_user.get('user_id')}")
        raise HTTPException(status_code=404, detail="Employee not found")
    leaves = db.query(Leave).filter(Leave.employee_id == employee.employee_id).all()
    logger.info(f"Retrieved {len(leaves)} leave records for employee_id: {employee.employee_id} with user_id: {current_user.get('user_id')}")
    return leaves

@router.post("/self", response_model=LeaveResponse, status_code=status.HTTP_201_CREATED)
def create_leave_self(leave: LeaveCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Create a leave request for the current user."""
    employee = db.query(Employee).filter(Employee.user_id == current_user.get("user_id")).first()
    if not employee:
        logger.error(f"Employee not found for user_id: {current_user.get('user_id')}")
        raise HTTPException(status_code=404, detail="Employee not found")
    if leave.employee_id and leave.employee_id != str(employee.employee_id):
        raise HTTPException(status_code=400, detail="Employee ID mismatch")
    leave_data = leave.model_dump(exclude_unset=True)
    leave_data["employee_id"] = str(employee.employee_id)
    leave_data["status"] = "pending"  # Default status for user-submitted leaves
    new_leave = Leave(**leave_data, created_at=datetime.now(timezone.utc))
    db.add(new_leave)
    db.commit()
    db.refresh(new_leave)
    return new_leave

@router.post("/", response_model=LeaveResponse, status_code=status.HTTP_201_CREATED)
def create_leave(leave: LeaveCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    """Create a new leave record (admin only)."""
    db_employee = db.query(Employee).filter(Employee.employee_id == leave.employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    leave_data = leave.model_dump()
    new_leave = Leave(**leave_data, created_at=datetime.now(timezone.utc))
    db.add(new_leave)
    db.commit()
    db.refresh(new_leave)
    return new_leave

@router.get("/", response_model=List[LeaveResponse])
def list_leaves(db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    """List all leave records (admin only)."""
    return db.query(Leave).all()

@router.get("/{leave_id}", response_model=LeaveResponse)
def get_leave(leave_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    """Get a leave record by ID (admin only)."""
    leave = db.query(Leave).filter(Leave.leave_id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave record not found")
    return leave

@router.put("/{leave_id}", response_model=LeaveResponse)
def update_leave(leave_id: str, leave: LeaveUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    """Update a leave record (admin only)."""
    db_leave = db.query(Leave).filter(Leave.leave_id == leave_id).first()
    if not db_leave:
        raise HTTPException(status_code=404, detail="Leave record not found")
    if leave.employee_id:
        db_employee = db.query(Employee).filter(Employee.employee_id == leave.employee_id).first()
        if not db_employee:
            raise HTTPException(status_code=404, detail="Employee not found")
    for key, value in leave.model_dump(exclude_unset=True).items():
        setattr(db_leave, key, value)
    db_leave.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_leave)
    return db_leave

@router.delete("/{leave_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_leave(leave_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    """Delete a leave record (admin only)."""
    db_leave = db.query(Leave).filter(Leave.leave_id == leave_id).first()
    if not db_leave:
        raise HTTPException(status_code=404, detail="Leave record not found")
    db.delete(db_leave)
    db.commit()

