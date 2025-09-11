from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import Optional, List
from app.schemas.employee import EmployeeBase


class DepartmentBase(BaseModel):
    name: str


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    manager_id: Optional[UUID4] = None


class DepartmentResponse(DepartmentBase):
    department_id: UUID4
    manager_id: Optional[UUID4] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # This allows Pydantic to work with SQLAlchemy models


class ManagerInfo(BaseModel):
    employee_id: UUID4
    first_name: str
    last_name: str

    class Config:
        from_attributes = True


class DepartmentWithManager(DepartmentResponse):
    manager: Optional[ManagerInfo] = None

    class Config:
        from_attributes = True