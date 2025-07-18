from sqlalchemy import Column, Date, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import relationship
import uuid
import enum
from app.database import Base

class LeaveType(enum.Enum):
    SICK = "sick"
    VACATION = "vacation"
    PERSONAL = "personal"
    UNPAID = "unpaid"

class LeaveStatus(enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

LeaveTypeEnum = ENUM("sick", "vacation", "personal", "unpaid", name="leave_type", create_type=False)
LeaveStatusEnum = ENUM("pending", "approved", "rejected", name="leave_status", create_type=False)

class Leave(Base):
    __tablename__ = "leaves"

    leave_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.employee_id"), nullable=False)
    leave_type = Column(LeaveTypeEnum, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(LeaveStatusEnum, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    employee = relationship("Employee", back_populates="leaves")