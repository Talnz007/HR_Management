from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel

from app.models.chat import ChatStatus, MessageType

# Chat Session Schemas
class ChatSessionBase(BaseModel):
    password_reset_request_id: Optional[UUID] = None  # Changed to optional
    employee_id: UUID
    admin_id: Optional[UUID] = None
    status: ChatStatus = ChatStatus.active

class ChatSessionCreate(ChatSessionBase):
    pass

class ChatSessionUpdate(BaseModel):
    admin_id: Optional[UUID] = None
    status: Optional[ChatStatus] = None

class ChatSessionInDB(ChatSessionBase):
    id: UUID
    created_at: datetime
    closed_at: Optional[datetime] = None
    last_activity_at: datetime

    class Config:
        from_attributes = True

# Chat Message Schemas
class ChatMessageBase(BaseModel):
    content: str
    message_type: MessageType = MessageType.text
    expires_at: Optional[datetime] = None

class ChatMessageCreate(ChatMessageBase):
    chat_session_id: UUID

class ChatMessageInDB(ChatMessageBase):
    id: UUID
    chat_session_id: UUID
    sender_id: Optional[UUID] = None  # Updated: Allow None for system messages
    is_encrypted: bool = False
    read_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Response Schemas
class ChatMessageResponse(ChatMessageInDB):
    sender_id: Optional[UUID] = None  # Updated: Allow None for system messages
    sender_name: str
    sender_role: str

class ChatSessionResponse(ChatSessionInDB):
    employee_name: str
    admin_name: Optional[str] = None
    unread_count: int = 0
    latest_message: Optional[ChatMessageResponse] = None
    messages: List[ChatMessageResponse] = []

class TempPasswordRequest(BaseModel):
    chat_session_id: UUID
    password_length: int = 12
