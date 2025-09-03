from sqlalchemy import Column, Date, Float, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.database import Base

class Payroll(Base):
    __tablename__ = "payrolls"
    payroll_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.employee_id"), nullable=False)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    base_salary = Column(Float, nullable=False)
    overtime_pay = Column(Float, nullable=True)
    deductions = Column(Float, nullable=True)
    net_pay = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    employee = relationship("Employee", back_populates="payrolls")