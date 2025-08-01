# app/schemas/password_reset.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class PasswordResetRequestCreate(BaseModel):
    username_or_email: str = Field(..., min_length=3, max_length=100)
    reason: Optional[str] = Field(None, max_length=500)


class PasswordResetRequestResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    username: str
    email: str
    status: str
    created_at: datetime
    resolved_at: Optional[datetime]
    admin_id: Optional[uuid.UUID]
    request_reason: Optional[str]

    class Config:
        from_attributes = True


class PasswordResetAction(BaseModel):
    action: str = Field(..., pattern="^(approve|reject)$")


class PasswordResetResponse(BaseModel):
    message: str
    temporary_password: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)


class MustChangePasswordResponse(BaseModel):
    must_change_password: bool