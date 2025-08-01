# app/models/password_reset.py
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.database import Base


class PasswordResetRequest(Base):
    __tablename__ = "password_reset_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), nullable=False, server_default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    admin_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    request_reason = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    admin = relationship("User", foreign_keys=[admin_id])
