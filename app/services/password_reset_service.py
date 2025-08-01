# app/services/password_reset_service.py
import secrets
import string
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime, timezone
from app.models.password_reset import PasswordResetRequest
from app.models.user import User
from app.models.admin import Admin
from app.core.security import get_password_hash, verify_password
from app.schemas.password_reset import PasswordResetRequestCreate, PasswordResetAction
import logging

logger = logging.getLogger(__name__)


class PasswordResetService:
    def __init__(self, db: Session):
        self.db = db

    def generate_temporary_password(self, length: int = 12) -> str:
        """Generate a secure temporary password"""
        characters = string.ascii_letters + string.digits + "!@#$%^&*"
        return ''.join(secrets.choice(characters) for _ in range(length))

    def create_reset_request(self, request_data: PasswordResetRequestCreate) -> dict:
        """Create a new password reset request"""
        # Find user by username or email
        user = self.db.query(User).filter(
            or_(
                User.username == request_data.username_or_email,
                User.email == request_data.username_or_email
            )
        ).first()

        if not user:
            # Don't reveal if user exists or not for security
            return {"message": "If the user exists, a reset request has been created."}

        # Check if there's already a pending request
        existing_request = self.db.query(PasswordResetRequest).filter(
            PasswordResetRequest.user_id == user.user_id,
            PasswordResetRequest.status == "pending"
        ).first()

        if existing_request:
            return {"message": "A reset request is already pending for this user."}

        # Create new request
        reset_request = PasswordResetRequest(
            user_id=user.user_id,
            request_reason=request_data.reason
        )

        self.db.add(reset_request)
        self.db.commit()
        self.db.refresh(reset_request)

        logger.info(f"Password reset request created for user {user.username}")
        return {"message": "Password reset request submitted successfully."}

    def get_pending_requests(self) -> List[PasswordResetRequest]:
        """Get all pending password reset requests"""
        return self.db.query(PasswordResetRequest).filter(
            PasswordResetRequest.status == "pending"
        ).order_by(PasswordResetRequest.created_at.desc()).all()

    def process_reset_request(self, request_id: str, action_data: PasswordResetAction, admin_id: str) -> dict:
        """Process a password reset request (approve/reject)"""
        reset_request = self.db.query(PasswordResetRequest).filter(
            PasswordResetRequest.id == request_id,
            PasswordResetRequest.status == "pending"
        ).first()

        if not reset_request:
            raise ValueError("Reset request not found or already processed")

        if action_data.action == "approve":
            # Generate temporary password
            temp_password = self.generate_temporary_password()

            # Update user's password
            user = self.db.query(User).filter(User.user_id == reset_request.user_id).first()
            user.password_hash = get_password_hash(temp_password)
            user.must_change_password = True

            # Update request status
            reset_request.status = "resolved"
            reset_request.resolved_at = datetime.now(timezone.utc)
            reset_request.admin_id = admin_id

            self.db.commit()

            logger.info(f"Password reset approved for user {user.username} by admin {admin_id}")
            return {
                "message": "Password reset approved successfully",
                "temporary_password": temp_password,
                "username": user.username,
                "email": user.email
            }

        elif action_data.action == "reject":
            reset_request.status = "rejected"
            reset_request.resolved_at = datetime.now(timezone.utc)
            reset_request.admin_id = admin_id

            self.db.commit()

            logger.info(f"Password reset rejected for request {request_id} by admin {admin_id}")
            return {"message": "Password reset request rejected"}

        else:
            raise ValueError("Invalid action. Must be 'approve' or 'reject'")

    def change_password_after_reset(self, user_id: str, current_password: str, new_password: str) -> dict:
        """Change password after using temporary password"""
        user = self.db.query(User).filter(User.user_id == user_id).first()

        if not user:
            raise ValueError("User not found")

        # Verify current password
        if not verify_password(current_password, user.password_hash):
            raise ValueError("Current password is incorrect")

        # Update password
        user.password_hash = get_password_hash(new_password)
        user.must_change_password = False

        self.db.commit()

        logger.info(f"Password changed successfully for user {user.username}")
        return {"message": "Password changed successfully"}
