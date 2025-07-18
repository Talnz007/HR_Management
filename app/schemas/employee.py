from pydantic import BaseModel, ConfigDict, Field, field_validator, field_serializer
from uuid import UUID
from datetime import date, datetime
from typing import Optional, Literal

class EmployeeBase(BaseModel):
    employee_number: str = Field(..., max_length=20)
    first_name: str = Field(..., max_length=50)
    last_name: str = Field(..., max_length=50)
    model_config = ConfigDict(extra="forbid")

class EmployeeCreate(EmployeeBase):
    middle_name: Optional[str] = Field(None, max_length=50)
    date_of_birth: date
    phone: str = Field(..., max_length=20)
    hire_date: date
    job_title: str = Field(..., max_length=100)
    department_id: str
    manager_id: Optional[str] = None
    employment_type: Literal["full_time", "part_time", "contract", "intern"]
    status: Literal["active", "inactive", "terminated"] = "active"
    salary: Optional[float] = None
    password: str = Field(..., min_length=8)  # Added for user creation

    @field_validator("department_id", "manager_id")
    @classmethod
    def validate_uuid(cls, v):
        if v is None:
            return v
        try:
            UUID(v)
        except ValueError:
            raise ValueError("Invalid UUID format")
        return v
    model_config = ConfigDict(extra="forbid")

class EmployeeResponse(EmployeeBase):
    employee_id: UUID
    user_id: UUID
    middle_name: Optional[str]
    date_of_birth: date
    phone: str
    hire_date: date
    job_title: str
    department_id: UUID
    manager_id: Optional[UUID]
    employment_type: str
    status: str
    salary: Optional[float]
    created_at: datetime
    updated_at: Optional[datetime]

    @field_serializer("employee_id", "user_id", "department_id", "manager_id")
    def serialize_uuid(self, v: Optional[UUID]) -> Optional[str]:
        return str(v) if v else None

    model_config = ConfigDict(from_attributes=True)