from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Union
import uuid
from datetime import datetime, time, date
from pytz import timezone as pytz_timezone
from app.api.deps import get_current_user, require_role
from app.database import get_db
from app.models.user import User
from app.models.attendance import Attendance
from app.schemas.attendance import AttendanceCreate, AttendanceResponse

router = APIRouter(tags=["attendance"])

def calculate_hours(clock_in: time, clock_out: time, break_start: time = None, break_end: time = None) -> tuple[float, float]:
    """Calculate total_hours and overtime_hours."""
    def time_to_seconds(t: time) -> int:
        return t.hour * 3600 + t.minute * 60 + t.second
    total_seconds = time_to_seconds(clock_out) - time_to_seconds(clock_in)
    if break_start and break_end:
        break_seconds = time_to_seconds(break_end) - time_to_seconds(break_start)
        total_seconds -= break_seconds
    total_hours = total_seconds / 3600.0  # Keep exact value
    overtime_hours = max(total_hours - 8.0, 0.0) if total_hours > 0 else 0.0
    return total_hours, overtime_hours

@router.post("/", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def create_attendance(attendance: AttendanceCreate, db: Session = Depends(get_db), current_user: dict = Depends(require_role(["admin"]))):
    """Create a new attendance record (admin only)."""
    db_user = db.query(User).filter(User.user_id == attendance.user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if attendance.attendance_type == "absent" and (attendance.clock_in or attendance.clock_out or attendance.break_start or attendance.break_end or attendance.total_hours or attendance.overtime_hours):
        raise HTTPException(status_code=400, detail="Absent attendance cannot have clock_in, clock_out, break_start, break_end, total_hours, or overtime_hours")
    attendance_data = attendance.model_dump(exclude_unset=True)
    if attendance.clock_in and attendance.clock_out:
        total_hours, overtime_hours = calculate_hours(
            attendance.clock_in, attendance.clock_out, attendance.break_start, attendance.break_end
        )
        attendance_data["total_hours"] = total_hours
        attendance_data["overtime_hours"] = overtime_hours
    pkt = pytz_timezone('Asia/Karachi')
    new_attendance = Attendance(**attendance_data, created_at=datetime.now(pkt).replace(microsecond=0))
    db.add(new_attendance)
    db.commit()
    db.refresh(new_attendance)
    return new_attendance

@router.get("/", response_model=List[AttendanceResponse])
def list_attendance(db: Session = Depends(get_db), current_user: dict = Depends(require_role(["admin"]))):
    """List all attendance records (admin only)."""
    return db.query(Attendance).all()

@router.get("/self", response_model=Union[AttendanceResponse, dict])
def get_attendance_self(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Get the current user's attendance for today."""
    attendance = db.query(Attendance).filter(
        Attendance.user_id == current_user.get("user_id"),
        Attendance.date == date.today()
    ).first()
    return attendance if attendance else {"message": "No attendance record today"}

@router.get("/{attendance_id}", response_model=AttendanceResponse)
def get_attendance(
    attendance_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin"]))
):
    """Get an attendance record by ID (admin only)."""
    attendance = db.query(Attendance).filter(Attendance.attendance_id == str(attendance_id)).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    return attendance

@router.put("/{attendance_id}", response_model=AttendanceResponse)
def update_attendance(
    attendance_id: uuid.UUID,
    attendance: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin"]))
):
    """Update an attendance record (admin only)."""
    db_attendance = db.query(Attendance).filter(Attendance.attendance_id == str(attendance_id)).first()
    if not db_attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    db_user = db.query(User).filter(User.user_id == attendance.user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if attendance.attendance_type == "absent" and (attendance.clock_in or attendance.clock_out or attendance.break_start or attendance.break_end or attendance.total_hours or attendance.overtime_hours):
        raise HTTPException(status_code=400, detail="Absent attendance cannot have clock_in, clock_out, break_start, break_end, total_hours, or overtime_hours")
    attendance_data = attendance.model_dump(exclude_unset=True)
    if attendance.clock_in and attendance.clock_out:
        total_hours, overtime_hours = calculate_hours(
            attendance.clock_in, attendance.clock_out, attendance.break_start, attendance.break_end
        )
        attendance_data["total_hours"] = total_hours
        attendance_data["overtime_hours"] = overtime_hours
    pkt = pytz_timezone('Asia/Karachi')
    for key, value in attendance_data.items():
        setattr(db_attendance, key, value)
    db_attendance.updated_at = datetime.now(pkt).replace(microsecond=0)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance

@router.delete("/{attendance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attendance(
    attendance_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin"]))
):
    """Delete an attendance record (admin only)."""
    db_attendance = db.query(Attendance).filter(Attendance.attendance_id == str(attendance_id)).first()
    if not db_attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    db.delete(db_attendance)
    db.commit()

@router.post("/self", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def create_attendance_self(attendance: AttendanceCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Create attendance record for the current user for today."""
    user_id = current_user.get("user_id")
    if db.query(Attendance).filter(
        Attendance.user_id == user_id,
        Attendance.date == date.today()
    ).first():
        raise HTTPException(status_code=400, detail="Attendance already marked today")
    if attendance.attendance_type == "absent" and (attendance.clock_in or attendance.clock_out or attendance.break_start or attendance.break_end or attendance.total_hours or attendance.overtime_hours):
        raise HTTPException(status_code=400, detail="Absent attendance cannot have clock_in, clock_out, break_start, break_end, total_hours, or overtime_hours")
    attendance_data = attendance.model_dump(exclude_unset=True)
    attendance_data["user_id"] = user_id
    attendance_data["date"] = date.today()
    if attendance_data.get("clock_in") and attendance_data.get("clock_out"):
        total_hours, overtime_hours = calculate_hours(
            attendance_data["clock_in"], attendance_data["clock_out"],
            attendance_data.get("break_start"), attendance_data.get("break_end")
        )
        attendance_data["total_hours"] = total_hours
        attendance_data["overtime_hours"] = overtime_hours
    pkt = pytz_timezone('Asia/Karachi')
    new_attendance = Attendance(**attendance_data, created_at=datetime.now(pkt).replace(microsecond=0))
    db.add(new_attendance)
    db.commit()
    db.refresh(new_attendance)
    return new_attendance

@router.post("/self/start", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def start_attendance_self(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Start the day for the current user, recording clock_in."""
    user_id = current_user.get("user_id")
    if db.query(Attendance).filter(
        Attendance.user_id == user_id,
        Attendance.date == date.today()
    ).first():
        raise HTTPException(status_code=400, detail="Attendance already started today")
    pkt = pytz_timezone('Asia/Karachi')
    current_time = datetime.now(pkt).time().replace(microsecond=0)
    new_attendance = Attendance(
        user_id=user_id,
        date=date.today(),
        clock_in=current_time,
        attendance_type="present",
        created_at=datetime.now(pkt).replace(microsecond=0)
    )
    db.add(new_attendance)
    db.commit()
    db.refresh(new_attendance)
    return new_attendance

@router.post("/self/pause", response_model=AttendanceResponse)
def pause_attendance_self(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Toggle pause/resume for the current user's attendance, recording break_start or break_end."""
    user_id = current_user.get("user_id")
    attendance = db.query(Attendance).filter(
        Attendance.user_id == user_id,
        Attendance.date == date.today()
    ).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="No attendance record found for today")
    if attendance.clock_out:
        raise HTTPException(status_code=400, detail="Cannot pause after clocking out")
    pkt = pytz_timezone('Asia/Karachi')
    current_time = datetime.now(pkt).time().replace(microsecond=0)
    if not attendance.break_start:
        attendance.break_start = current_time
    elif not attendance.break_end:
        attendance.break_end = current_time
    else:
        raise HTTPException(status_code=400, detail="Break already completed")
    attendance.updated_at = datetime.now(pkt).replace(microsecond=0)
    db.commit()
    db.refresh(attendance)
    return attendance

@router.post("/self/stop", response_model=AttendanceResponse)
def stop_attendance_self(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Stop the day for the current user, recording clock_out and calculating hours."""
    user_id = current_user.get("user_id")
    attendance = db.query(Attendance).filter(
        Attendance.user_id == user_id,
        Attendance.date == date.today()
    ).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="No attendance record found for today")
    if attendance.clock_out:
        raise HTTPException(status_code=400, detail="Already clocked out")
    pkt = pytz_timezone('Asia/Karachi')
    current_time = datetime.now(pkt).time().replace(microsecond=0)
    if attendance.break_start and not attendance.break_end:
        attendance.break_end = current_time
    attendance.clock_out = current_time
    total_hours, overtime_hours = calculate_hours(
        attendance.clock_in,
        attendance.clock_out,
        attendance.break_start,
        attendance.break_end
    )
    attendance.total_hours = total_hours
    attendance.overtime_hours = overtime_hours
    attendance.updated_at = datetime.now(pkt).replace(microsecond=0)
    db.commit()
    db.refresh(attendance)
    return attendance

@router.get("/self/history", response_model=List[AttendanceResponse])
def get_attendance_history_self(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Get the current user's entire attendance history."""
    attendance_records = db.query(Attendance).filter(
        Attendance.user_id == current_user.get("user_id")
    ).order_by(Attendance.date.desc()).all()
    return attendance_records