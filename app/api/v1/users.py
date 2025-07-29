# app/api/v1/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.schemas.user import UserCreate, UserResponse, Token
from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.admin import Admin


from app.database import get_db
from app.models.user import User
from app.models.employee import Employee # <-- IMPORT EMPLOYEE MODEL HERE
from app.core.security import get_password_hash, create_access_token, verify_password, create_refresh_token
from app.api.deps import get_current_user, require_role
from datetime import datetime, timedelta, timezone

import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/users", tags=["users"])


class UserProfileResponse(BaseModel):
    user_id: str
    username: str
    email: str
    role: str  # 'admin' or 'employee'


@router.get("/me", response_model=UserProfileResponse)
def read_users_me(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Get the profile and role of the current authenticated user.
    """
    user_id = current_user.get("user_id")

    # Check if the user is an admin
    is_admin = db.query(Admin).filter(Admin.user_id == user_id).first() is not None
    role = "admin" if is_admin else "employee"

    # Fetch user details
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "user_id": str(user.user_id),
        "username": user.username,
        "email": user.email,
        "role": role,
    }

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
