# app/schemas/user.py
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from uuid import UUID
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str
    phone: str = Field(..., max_length=20)  # Added
    model_config = ConfigDict(extra="forbid")

class UserCreate(UserBase): 
    password: str = Field(..., min_length=8)

class UserResponse(UserBase):
    user_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]
    last_login: Optional[datetime]
    # --- ADD THIS LINE ---
    profile_picture_key: Optional[str] = None
    role: str


    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str
    expires_in: int

