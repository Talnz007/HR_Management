from pydantic import BaseModel, ConfigDict, Field, field_validator, field_serializer
from uuid import UUID
from datetime import date, time, datetime
from typing import Optional, Literal

class AttendanceBase(BaseModel):
    employee_id: str
    date: date
    clock_in: Optional[time] = None
    clock_out: Optional[time] = None
    break_start: Optional[time] = None
    break_end: Optional[time] = None
    attendance_type: Literal["present", "absent", "late"] = "present"
    total_hours: Optional[float] = None
    overtime_hours: Optional[float] = None
    model_config = ConfigDict(extra="forbid")

class AttendanceCreate(AttendanceBase):
    @field_validator("employee_id")
    @classmethod
    def validate_uuid(cls, v):
        try:
            UUID(v)
        except ValueError:
            raise ValueError("Invalid UUID format")
        return v

class AttendanceResponse(AttendanceBase):
    attendance_id: UUID
    employee_id: UUID
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    @field_serializer("attendance_id", "employee_id")
    def serialize_uuid(self, v: UUID) -> str:
        return str(v)

    model_config = ConfigDict(from_attributes=True)