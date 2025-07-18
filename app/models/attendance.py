from sqlalchemy import Column, Date, Time, Float, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import relationship
import uuid
import enum
from app.database import Base

class AttendanceType(enum.Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"

AttendanceTypeEnum = ENUM(
    "present", "absent", "late",
    name="attendance_type",
    create_type=True
)

class Attendance(Base):
    __tablename__ = "attendances"

    attendance_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.employee_id"), nullable=False)
    date = Column(Date, nullable=False)
    clock_in = Column(Time, nullable=True)
    clock_out = Column(Time, nullable=True)
    break_start = Column(Time, nullable=True)
    break_end = Column(Time, nullable=True)
    attendance_type = Column(AttendanceTypeEnum, nullable=False, default=AttendanceType.PRESENT)
    total_hours = Column(Float, nullable=True)
    overtime_hours = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    employee = relationship("Employee", back_populates="attendances")