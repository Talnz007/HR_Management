from sqlalchemy import Column, String, Boolean, DateTime, func, Enum
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base
from sqlalchemy.orm import relationship, Mapped, mapped_column
from typing import Optional
import enum

# Define an Enum for user roles
class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    EMPLOYEE = "employee"

class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    must_change_password = Column(Boolean, default=False)
    profile_picture_key: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Add the role column
    role = Column(Enum(UserRole), default=UserRole.EMPLOYEE, nullable=False)

    employee = relationship("Employee", back_populates="user", uselist=False)
    admin = relationship("Admin", back_populates="user", uselist=False)
    registrations = relationship("Registration", back_populates="user")
    attendances = relationship("Attendance", back_populates="user")
    password_reset_requests = relationship("PasswordResetRequest", foreign_keys="PasswordResetRequest.user_id")
    employee_chat_sessions = relationship("ChatSession", foreign_keys="ChatSession.employee_id",
                                          back_populates="employee")
    admin_chat_sessions = relationship("ChatSession", foreign_keys="ChatSession.admin_id", back_populates="admin")
    chat_messages = relationship("ChatMessage", back_populates="sender")