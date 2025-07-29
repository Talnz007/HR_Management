from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import Optional

class DepartmentBase(BaseModel):
    name: str

class DepartmentResponse(DepartmentBase):
    department_id: UUID4
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # This allows Pydantic to work with SQLAlchemy models