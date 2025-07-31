from pydantic import BaseModel, ConfigDict, Field, field_validator, field_serializer
from uuid import UUID
from datetime import date, datetime
from typing import Optional

class PayrollBase(BaseModel):
    employee_id: str
    period_start: date
    period_end: date
    base_salary: Optional[float] = None
    overtime_pay: Optional[float] = None
    deductions: Optional[float] = None
    net_pay: Optional[float] = None
    model_config = ConfigDict(extra="forbid")

class PayrollCreate(PayrollBase):
    @field_validator("employee_id")
    @classmethod
    def validate_uuid(cls, v):
        try:
            UUID(v)
        except ValueError:
            raise ValueError("Invalid UUID format")
        return v

class PayrollResponse(PayrollBase):
    payroll_id: UUID
    employee_id: UUID
    created_at: datetime
    updated_at: Optional[datetime]

    @field_serializer("payroll_id", "employee_id")
    def serialize_uuid(self, v: UUID) -> str:
        return str(v)

    model_config = ConfigDict(from_attributes=True)