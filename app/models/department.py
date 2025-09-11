from sqlalchemy import Column, String, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.database import Base


class Department(Base):
    __tablename__ = "departments"
    department_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True)
    manager_id = Column(UUID(as_uuid=True), ForeignKey("employees.employee_id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Specify foreign_keys explicitly to resolve ambiguity
    employees = relationship(
        "Employee",
        back_populates="department",
        foreign_keys="Employee.department_id",
        overlaps="manager"  # Resolves potential overlap warning
    )

    # Specify foreign_keys for manager relationship
    manager = relationship(
        "Employee",
        back_populates="managed_department",
        foreign_keys=[manager_id],
        overlaps="employees"  # Resolves potential overlap warning
    )