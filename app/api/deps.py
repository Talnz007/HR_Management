# app/api/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List
import logging
from app.database import get_db
from app.core.security import verify_token, redis_client
from app.models.user import User
from app.models.employee import Employee
from app.models.admin import Admin

logger = logging.getLogger(__name__)

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get the current authenticated user."""
    username = verify_token(credentials.credentials)
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"}
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    logger.info(f"Authenticated user: {username}")
    return user

def get_current_employee(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Employee:
    """Get the employee profile for the current user."""
    employee = db.query(Employee).filter(Employee.user_id == current_user.user_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee profile not found"
        )
    return employee

def require_role(required_roles: List[str]):
    """Decorator to enforce role-based access control using admins table."""
    def role_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> User:
        # Check if user is an admin for 'admin' role
        is_admin = db.query(Admin).filter(Admin.user_id == current_user.user_id).first() is not None
        user_roles = ["admin"] if is_admin else ["employee"]
        if not any(role in required_roles for role in user_roles):
            logger.warning(f"Access denied for user {current_user.username}: required roles {required_roles}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of the following roles: {', '.join(required_roles)}"
            )
        return current_user
    return role_checker