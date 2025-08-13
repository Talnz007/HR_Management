from sqlalchemy import Column, String, Text, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.database import Base

class ChatStatus(enum.Enum):
    active = "active"          # lowercase to match database
    closed = "closed"          # lowercase to match database
    escalated = "escalated"    # lowercase to match database

class MessageType(enum.Enum):
    text = "text"                          # lowercase to match database
    system = "system"                      # lowercase to match database
    temp_password = "temp_password"        # lowercase to match database
    file = "file"                          # lowercase to match database

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    password_reset_request_id = Column(UUID(as_uuid=True), ForeignKey("password_reset_requests.id"), nullable=True)  # Changed to nullable=True
    employee_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    admin_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    status = Column(Enum(ChatStatus, name="chat_status"), default=ChatStatus.active)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    closed_at = Column(DateTime(timezone=True), nullable=True)
    last_activity_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    password_reset_request = relationship("PasswordResetRequest", back_populates="chat_sessions")
    employee = relationship("User", foreign_keys=[employee_id], back_populates="employee_chat_sessions")
    admin = relationship("User", foreign_keys=[admin_id], back_populates="admin_chat_sessions")
    messages = relationship("ChatMessage", back_populates="chat_session", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.id"), nullable=False)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)  # Changed to nullable=True
    message_type = Column(Enum(MessageType, name="message_type"), default=MessageType.text)
    content = Column(Text, nullable=False)
    is_encrypted = Column(Boolean, default=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    chat_session = relationship("ChatSession", back_populates="messages")
    sender = relationship("User", back_populates="chat_messages")
