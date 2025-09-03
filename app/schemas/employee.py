from pydantic import BaseModel, ConfigDict, Field, field_validator, field_serializer
from uuid import UUID
from datetime import date, datetime
from typing import Optional, Literal
from app.schemas.user import UserRole

class EmployeeBase(BaseModel):
    employee_number: str = Field(..., max_length=20)
    first_name: str = Field(..., max_length=50)
    last_name: str = Field(..., max_length=50)
    # **FIX:** Change extra="forbid" to extra="ignore" on the base model
    # This is a safer default, as it prevents crashes if the DB model has extra fields
    # but doesn't require them to be explicitly popped.
    model_config = ConfigDict(extra="ignore")

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
    password: str = Field(..., min_length=8)

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
    profile_picture_key: Optional[str] = None
    # **FIX:** Make role optional here, we will populate it manually in the endpoint.
    role: Optional[UserRole] = None

    @field_serializer("employee_id", "user_id", "department_id", "manager_id")
    def serialize_uuid(self, v: Optional[UUID]) -> Optional[str]:
        return str(v) if v else None

    model_config = ConfigDict(from_attributes=True)

class EmployeeRoleUpdate(BaseModel):
    role: UserRole