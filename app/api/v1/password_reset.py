# app/api/v1/password_reset.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.services.password_reset_service import PasswordResetService
from app.schemas.password_reset import (
    PasswordResetRequestCreate,
    PasswordResetRequestResponse,
    PasswordResetAction,
    PasswordResetResponse,
    ChangePasswordRequest,
    MustChangePasswordResponse
)
from app.api.deps import get_current_user, require_role
from app.models.user import User

router = APIRouter(prefix="/password-reset", tags=["password-reset"])


@router.post("/request", response_model=dict)
async def create_password_reset_request(
        request_data: PasswordResetRequestCreate,
        db: Session = Depends(get_db)
):
    """Create a password reset request"""
    service = PasswordResetService(db)
    return service.create_reset_request(request_data)


@router.get("/requests", response_model=List[PasswordResetRequestResponse])
async def get_password_reset_requests(
        db: Session = Depends(get_db),
        current_user: dict = Depends(require_role(["admin"]))
):
    """Get all pending password reset requests (Admin only)"""
    service = PasswordResetService(db)
    requests = service.get_pending_requests()

    # Transform the data to include user information
    response_data = []
    for req in requests:
        response_data.append({
            "id": req.id,
            "user_id": req.user_id,
            "username": req.user.username,
            "email": req.user.email,
            "status": req.status,
            "created_at": req.created_at,
            "resolved_at": req.resolved_at,
            "admin_id": req.admin_id,
            "request_reason": req.request_reason
        })

    return response_data


@router.post("/requests/{request_id}/process", response_model=PasswordResetResponse)
async def process_password_reset_request(
        request_id: str,
        action_data: PasswordResetAction,
        db: Session = Depends(get_db),
        current_user: dict = Depends(require_role(["admin"]))
):
    """Process a password reset request (Admin only)"""
    service = PasswordResetService(db)
    try:
        return service.process_reset_request(request_id, action_data, current_user.get("user_id"))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/change-password", response_model=dict)
async def change_password_after_reset(
        password_data: ChangePasswordRequest,
        db: Session = Depends(get_db),
        current_user: dict = Depends(get_current_user)
):
    """Change password after using temporary password"""
    service = PasswordResetService(db)
    try:
        return service.change_password_after_reset(
            current_user.get("user_id"),
            password_data.current_password,
            password_data.new_password
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/must-change-password", response_model=MustChangePasswordResponse)
async def check_must_change_password(
        current_user: dict = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Check if user must change password"""
    user = db.query(User).filter(User.user_id == current_user.get("user_id")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {"must_change_password": user.must_change_password or False}
