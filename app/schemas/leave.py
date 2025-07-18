from pydantic import BaseModel, ConfigDict, Field, field_validator, field_serializer
from uuid import UUID
from datetime import date, datetime
from typing import Optional, Literal

class LeaveBase(BaseModel):
    employee_id: str
    leave_type: Literal["sick", "vacation", "personal", "unpaid"]
    start_date: date
    end_date: date
    status: Optional[Literal["pending", "approved", "rejected"]] = None
    model_config = ConfigDict(extra="forbid")

class LeaveCreate(LeaveBase):
    @field_validator("employee_id")
    @classmethod
    def validate_uuid(cls, v):
        try:
            UUID(v)
        except ValueError:
            raise ValueError("Invalid UUID format")
        return v

class LeaveResponse(LeaveBase):
    leave_id: UUID
    employee_id: UUID
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    @field_serializer("leave_id", "employee_id")
    def serialize_uuid(self, v: UUID) -> str:
        return str(v)

    model_config = ConfigDict(from_attributes=True)