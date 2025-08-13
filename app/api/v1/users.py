# app/api/v1/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.schemas.user import UserCreate, UserResponse, Token
from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.admin import Admin
import os
import uuid
from pathlib import Path
from typing import Any
import aiofiles
from fastapi import File, UploadFile
from uuid import UUID
from app.config import settings

from app.database import get_db
from app.models.user import User
from app.models.employee import Employee # <-- IMPORT EMPLOYEE MODEL HERE
from app.core.security import get_password_hash, create_access_token, verify_password, create_refresh_token
from app.api.deps import get_current_user, require_role
from datetime import datetime, timedelta, timezone

import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/users", tags=["users"])


# class UserProfileResponse(BaseModel):
#     user_id: str
#     username: str
#     email: str
#     role: str  # 'admin' or 'employee'


@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Get the complete profile and role of the current authenticated user.
    """
    user_id = current_user.get("user_id")

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # --- THIS IS THE FIX ---
    # Explicitly check if the user is an admin
    is_admin = db.query(Admin).filter(Admin.user_id == user.user_id).first() is not None

    # Add the role to the user object before returning it.
    # Pydantic will pick this up if the schema is updated.
    user.role = "admin" if is_admin else "employee"

    return user


MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"]


@router.post("/{user_id}/profile-picture", response_model=UserResponse)
async def upload_profile_picture(
        user_id: UUID,
        db: Session = Depends(get_db),
        current_user_token: dict = Depends(get_current_user),
        file: UploadFile = File(...),
) -> Any:
    """
    Upload or replace a user's profile picture.
    """
    current_user_id = current_user_token.get("user_id")
    db_current_user = db.query(User).filter(User.user_id == current_user_id).first()

    user_to_update = db.query(User).filter(User.user_id == user_id).first()
    if not user_to_update:
        raise HTTPException(status_code=404, detail="User not found")

    # Authorization check: User must be self or an HR Admin
    is_admin = db.query(Admin).filter(Admin.user_id == db_current_user.user_id).first() is not None
    if db_current_user.user_id != user_to_update.user_id and not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    # File Validation
    if file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File size exceeds 5MB")
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG and PNG are allowed.")

    # File Processing
    os.makedirs(settings.PROFILE_PICTURES_DIR, exist_ok=True)

    if user_to_update.profile_picture_key:
        old_file_path = Path(settings.PROFILE_PICTURES_DIR) / user_to_update.profile_picture_key
        if old_file_path.is_file():
            os.remove(old_file_path)

    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = Path(settings.PROFILE_PICTURES_DIR) / unique_filename

    try:
        async with aiofiles.open(file_path, "wb") as out_file:
            content = await file.read()
            await out_file.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving file: {e}")

    user_to_update.profile_picture_key = unique_filename
    db.commit()
    db.refresh(user_to_update)

    return user_to_update


@router.delete("/{user_id}/profile-picture", response_model=UserResponse)
def delete_profile_picture(
        user_id: UUID,
        db: Session = Depends(get_db),
        current_user_token: dict = Depends(get_current_user),
) -> Any:
    """
    Delete a user's profile picture.
    """
    current_user_id = current_user_token.get("user_id")
    db_current_user = db.query(User).filter(User.user_id == current_user_id).first()

    user_to_update = db.query(User).filter(User.user_id == user_id).first()
    if not user_to_update:
        raise HTTPException(status_code=404, detail="User not found")

    is_admin = db.query(Admin).filter(Admin.user_id == db_current_user.user_id).first() is not None
    if db_current_user.user_id != user_to_update.user_id and not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    if not user_to_update.profile_picture_key:
        raise HTTPException(status_code=404, detail="User does not have a profile picture to delete.")

    file_path = Path(settings.PROFILE_PICTURES_DIR) / user_to_update.profile_picture_key
    if file_path.is_file():
        os.remove(file_path)

    user_to_update.profile_picture_key = None
    db.commit()
    db.refresh(user_to_update)

    return user_to_update

from app.schemas.employee import EmployeeResponse # <-- Make sure to import EmployeeResponse schema

@router.get("/me/profile", response_model=EmployeeResponse) # New path
def get_my_employee_profile(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Get the current user's detailed employee profile."""
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User ID not found in token payload.")

    employee = db.query(Employee).filter(Employee.user_id == user_id).first()
    if not employee:
        # It's possible for a user to exist but not have an employee profile yet
        raise HTTPException(status_code=404, detail="Employee profile not found for this user.")
    return employee
