# app/api/v1/password_reset.py
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict
from app.database import get_db
from app.services.password_reset_service import PasswordResetService, SelfServicePasswordReset
from app.schemas.password_reset import (
    PasswordResetRequestCreate,
    PasswordResetRequestResponse,
    PasswordResetAction,
    PasswordResetResponse,
    ChangePasswordRequest,
    MustChangePasswordResponse,
    PasswordResetEmailRequest # <-- NEW SCHEMA
)
from app.api.deps import get_current_user, require_role
from app.models.user import User
from app.socket import sio

router = APIRouter(prefix="/password-reset", tags=["password-reset"])


@router.post("/request-reset", status_code=status.HTTP_200_OK, response_model=Dict[str, str])
async def request_password_reset_email(
        request: PasswordResetEmailRequest,
        background_tasks: BackgroundTasks
):
    """
    Public endpoint for users to request a password reset email.
    It will always return a generic success message to prevent email enumeration (FR-1.4).
    The actual work is done in the background.
    """
    service = SelfServicePasswordReset()
    background_tasks.add_task(service.request_password_reset, email=request.email)

    return {"message": "If an account with that email exists, a password reset link has been sent."}

@router.post("/request", response_model=dict)
async def create_password_reset_request(
        request_data: PasswordResetRequestCreate,
        db: Session = Depends(get_db)
):
    service = PasswordResetService(db)
    result = service.create_reset_request(request_data)

    # Emit event only if real user request created
    if "submitted successfully" in result.get("message", "").lower():
        # Get user info to send
        user = db.query(User).filter(
            (User.username == request_data.username_or_email) |
            (User.email == request_data.username_or_email)
        ).first()
        if user:
            await sio.emit(
                "password_reset_request_created",
                {
                    "user_id": str(user.user_id),  # Convert UUID to string
                    "username": user.username,
                    "reason": request_data.reason,
                },
                room="admins",
            )
    return result



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
    service = PasswordResetService(db)
    try:
        payload = service.process_reset_request(request_id, action_data, current_user.get("user_id"))

        # Notify the affected user by user_id room (assuming payload has username)
        target_user = db.query(User).filter(User.username == payload.get("username")).first()
        if target_user:
            await sio.emit(
                "password_reset_processed",
                payload,  # includes temporary_password, message, etc.
                room=f"user:{target_user.user_id}"
            )
        return payload
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/status")
async def get_password_reset_status(
        current_user: dict = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Check if user has active password reset request."""
    from app.models.password_reset import PasswordResetRequest

    active_request = db.query(PasswordResetRequest).filter(
        PasswordResetRequest.user_id == current_user.get("user_id"),
        PasswordResetRequest.status == "pending"
    ).first()

    return {
        "has_active_request": active_request is not None,
        "request_id": str(active_request.id) if active_request else None
    }

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
