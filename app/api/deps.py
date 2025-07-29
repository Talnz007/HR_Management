# /home/talnz/PythonProjects/hr-system/app/api/deps.py
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
) -> dict:
    """Get the current authenticated user's payload."""
    payload = verify_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    user = db.query(User).filter(User.username == payload.get("sub")).first()
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
    logger.info(f"Authenticated user: {payload.get('sub')}, user_id: {payload.get('user_id')}. Token Payload: {payload}") # Added user_id and full payload log
    return payload

def get_current_employee(
    current_user: dict = Depends(get_current_user), # Keep as dict
    db: Session = Depends(get_db)
) -> Employee:
    """Get the employee profile for the current user."""
    # Ensure current_user is treated as a dict here too
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID not found in token payload for employee lookup"
        )
    employee = db.query(Employee).filter(Employee.user_id == user_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee profile not found"
        )
    return employee

def require_role(required_roles: List[str]):
    """Decorator to enforce role-based access control using admins table."""
    logger.info(f"--- require_role called with required_roles: {required_roles} ---") # New prominent log
    def role_checker(
        current_user: dict = Depends(get_current_user), # Use dict here
        db: Session = Depends(get_db)
    ) -> dict:
        user_id = current_user.get("user_id") # Correctly access user_id from dict
        username = current_user.get("sub") # Get username for logging

        if not user_id:
            logger.error(f"Role checker: User ID missing from current_user payload for user {username}.")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User ID missing for role check.")

        # Check if user is an admin for 'admin' role
        is_admin = db.query(Admin).filter(Admin.user_id == user_id).first() is not None
        user_roles = ["admin"] if is_admin else ["employee"]
        logger.info(f"Role checker: User {username} (ID: {user_id}) has roles: {user_roles}. Required: {required_roles}") # New log
        if not any(role in required_roles for role in user_roles):
            logger.warning(f"Access denied for user {username}: required roles {required_roles}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of the following roles: {', '.join(required_roles)}"
            )
        return current_user
    return role_checker