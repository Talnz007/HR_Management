from sqlalchemy import Column, String, Date, ForeignKey, DateTime, func, DECIMAL
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import relationship
import uuid
import enum
from app.database import Base

class EmploymentType(enum.Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERN = "intern"

class EmployeeStatus(enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    TERMINATED = "terminated"

EmploymentTypeEnum = ENUM(
    "full_time", "part_time", "contract", "intern",
    name="employment_type",
    create_type=True
)
EmployeeStatusEnum = ENUM(
    "active", "inactive", "terminated",
    name="employee_status",
    create_type=True
)

class Employee(Base):
    __tablename__ = "employees"

    employee_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    employee_number = Column(String(20), unique=True, index=True, nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    middle_name = Column(String(50), nullable=True)
    date_of_birth = Column(Date, nullable=False)
    phone = Column(String(20), nullable=False)
    hire_date = Column(Date, nullable=False)
    job_title = Column(String(100), nullable=False)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.department_id"), nullable=False)
    manager_id = Column(UUID(as_uuid=True), ForeignKey("employees.employee_id"), nullable=True)
    employment_type = Column(EmploymentTypeEnum, nullable=False)
    status = Column(EmployeeStatusEnum, default=EmployeeStatus.ACTIVE)
    salary = Column(DECIMAL(10, 2), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    user = relationship("User", back_populates="employee")
    department = relationship(
        "Department",
        back_populates="employees",
        foreign_keys=[department_id],
        overlaps="managed_department"  # Resolves potential overlap warning
    )
    manager = relationship("Employee", remote_side=[employee_id], back_populates="subordinates")
    subordinates = relationship("Employee", back_populates="manager")
    leaves = relationship("Leave", back_populates="employee")
    payrolls = relationship("Payroll", back_populates="employee")
    # Add this to the existing Employee class
    managed_department = relationship(
        "Department",
        back_populates="manager",
        foreign_keys="Department.manager_id",
        overlaps="department"  # Resolves potential overlap warning
    )