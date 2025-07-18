# app/api/v1/attendance.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.api.deps import require_role
from app.database import get_db
from app.models.user import User
from app.models.employee import Employee
from app.models.attendance import Attendance
from app.schemas.attendance import AttendanceCreate, AttendanceResponse
from datetime import datetime, timezone

router = APIRouter(tags=["attendance"])

@router.post("/", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def create_attendance(attendance: AttendanceCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    """Create a new attendance record (admin only)."""
    db_employee = db.query(Employee).filter(Employee.employee_id == attendance.employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    if attendance.attendance_type == "absent" and (attendance.clock_in or attendance.clock_out or attendance.break_start or attendance.break_end or attendance.total_hours or attendance.overtime_hours):
        raise HTTPException(status_code=400, detail="Absent attendance cannot have clock_in, clock_out, break_start, break_end, total_hours, or overtime_hours")
    attendance_data = attendance.model_dump()
    new_attendance = Attendance(**attendance_data, created_at=datetime.now(timezone.utc))
    db.add(new_attendance)
    db.commit()
    db.refresh(new_attendance)
    return new_attendance

@router.get("/", response_model=List[AttendanceResponse])
def list_attendance(db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    """List all attendance records (admin only)."""
    return db.query(Attendance).all()

@router.get("/{attendance_id}", response_model=AttendanceResponse)
def get_attendance(attendance_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    """Get an attendance record by ID (admin only)."""
    attendance = db.query(Attendance).filter(Attendance.attendance_id == attendance_id).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    return attendance

@router.put("/{attendance_id}", response_model=AttendanceResponse)
def update_attendance(attendance_id: str, attendance: AttendanceCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    """Update an attendance record (admin only)."""
    db_attendance = db.query(Attendance).filter(Attendance.attendance_id == attendance_id).first()
    if not db_attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    db_employee = db.query(Employee).filter(Employee.employee_id == attendance.employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    if attendance.attendance_type == "absent" and (attendance.clock_in or attendance.clock_out or attendance.break_start or attendance.break_end or attendance.total_hours or attendance.overtime_hours):
        raise HTTPException(status_code=400, detail="Absent attendance cannot have clock_in, clock_out, break_start, break_end, total_hours, or overtime_hours")
    for key, value in attendance.model_dump().items():
        setattr(db_attendance, key, value)
    db_attendance.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance

@router.delete("/{attendance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attendance(attendance_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    """Delete an attendance record (admin only)."""
    db_attendance = db.query(Attendance).filter(Attendance.attendance_id == attendance_id).first()
    if not db_attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    db.delete(db_attendance)
    db.commit()