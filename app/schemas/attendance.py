from pydantic import BaseModel, ConfigDict, field_validator, field_serializer
from uuid import UUID
from datetime import date, time, datetime
from typing import Optional, Literal

class AttendanceBase(BaseModel):
    user_id: Optional[UUID] = None  # Auto-populated
    date: Optional[date] = None  # Auto-populated
    clock_in: Optional[time] = None
    clock_out: Optional[time] = None
    break_start: Optional[time] = None
    break_end: Optional[time] = None
    attendance_type: Literal["present", "absent", "late"] = "present"
    total_hours: Optional[float] = None
    overtime_hours: Optional[float] = None
    model_config = ConfigDict(extra="forbid")

class AttendanceCreate(AttendanceBase):
    @field_validator("user_id")
    @classmethod
    def validate_uuid(cls, v):
        if v is None:
            return v
        try:
            UUID(str(v))
        except ValueError:
            raise ValueError("Invalid UUID format")
        return v

class AttendanceResponse(AttendanceBase):
    attendance_id: UUID
    user_id: UUID
    date: date
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    @field_serializer("attendance_id", "user_id")
    def serialize_uuid(self, v: UUID) -> str:
        return str(v)

    model_config = ConfigDict(from_attributes=True, extra="allow")