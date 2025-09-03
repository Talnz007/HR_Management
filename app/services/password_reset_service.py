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
import base64
from email.message import EmailMessage
import google.auth
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from supabase import create_client, Client
from app.config import settings
import pickle
import os
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

logger = logging.getLogger(__name__)

# Existing admin-driven service
class PasswordResetService:
    def __init__(self, db: Session):
        self.db = db

    def generate_temporary_password(self, length: int = 12) -> str:
        characters = string.ascii_letters + string.digits + "!@#$%^&*"
        return ''.join(secrets.choice(characters) for _ in range(length))

    def create_reset_request(self, request_data: PasswordResetRequestCreate) -> dict:
        user = self.db.query(User).filter(
            or_(
                User.username == request_data.username_or_email,
                User.email == request_data.username_or_email
            )
        ).first()
        if not user:
            return {"message": "If the user exists, a reset request has been created."}
        existing_request = self.db.query(PasswordResetRequest).filter(
            PasswordResetRequest.user_id == user.user_id,
            PasswordResetRequest.status == "pending"
        ).first()
        if existing_request:
            return {"message": "A reset request is already pending for this user."}
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
        return self.db.query(PasswordResetRequest).filter(
            PasswordResetRequest.status == "pending"
        ).order_by(PasswordResetRequest.created_at.desc()).all()

    def process_reset_request(self, request_id: str, action_data: PasswordResetAction, admin_id: str) -> dict:
        reset_request = self.db.query(PasswordResetRequest).filter(
            PasswordResetRequest.id == request_id,
            PasswordResetRequest.status == "pending"
        ).first()
        if not reset_request:
            raise ValueError("Reset request not found or already processed")
        if action_data.action == "approve":
            temp_password = self.generate_temporary_password()
            user = self.db.query(User).filter(User.user_id == reset_request.user_id).first()
            user.password_hash = get_password_hash(temp_password)
            user.must_change_password = True
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
        user = self.db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise ValueError("User not found")
        if not verify_password(current_password, user.password_hash):
            raise ValueError("Current password is incorrect")
        user.password_hash = get_password_hash(new_password)
        user.must_change_password = False
        self.db.commit()
        logger.info(f"Password changed successfully for user {user.username}")
        return {"message": "Password changed successfully"}


# New self-service flow
class SelfServicePasswordReset:
    def __init__(self):
        self.supabase_admin: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        self.gmail_service = self._get_gmail_service()

    def _get_gmail_service(self):
        creds = None
        token_path = 'token.pickle'  # The file saved by your oauth consent script
        if os.path.exists(token_path):
            with open(token_path, 'rb') as token_file:
                creds = pickle.load(token_file)
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())

        try:
            service = build('gmail', 'v1', credentials=creds)
            return service
        except Exception as e:
            logger.error(f"Failed to initialize Gmail service: {e}")
            return None

    def _create_and_send_message(self, to_email: str, subject: str, body_html: str):
        if not self.gmail_service:
            logger.error("Gmail service is not available. Cannot send email.")
            return
        try:
            message = EmailMessage()
            message.set_content(f"Please view this email in an HTML-compatible client.")
            message.add_alternative(body_html, subtype='html')
            message["To"] = to_email
            message["From"] = settings.GMAIL_SENDER_EMAIL
            message["Subject"] = subject
            encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
            create_message = {"raw": encoded_message}
            send_message = (
                self.gmail_service.users()
                .messages()
                .send(userId="me", body=create_message)
                .execute()
            )
            logger.info(f"Password reset email sent to {to_email}. Message ID: {send_message['id']}")
        except HttpError as error:
            logger.error(f"An error occurred while sending email: {error}")

    def request_password_reset(self, email: str):
        try:
            params = {
                "type": "recovery",  # specifies password recovery
                "email": email,
                "redirectTo": "http://localhost:3000/update-password"
            }

            response = self.supabase_admin.auth.admin.generate_link(params)

            reset_link = response.properties.action_link
            logger.info(f"Generated password reset link for {email}")
            subject = "Your Password Reset Request for HR Management System"
            body_html = f"""
            <html>
            <body>
                <h2>Password Reset Request</h2>
                <p>Hello,</p>
                <p>We received a request to reset your password. Please click the link below to set a new password. This link is valid for 60 minutes.</p>
                <p><a href="{reset_link}" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Your Password</a></p>
                <p>If you did not request a password reset, please ignore this email.</p>
                <p>Thanks,<br/>The HR Management Team</p>
            </body>
            </html>
            """
            self._create_and_send_message(to_email=email, subject=subject, body_html=body_html)
        except Exception as e:
            logger.error(f"Error during password reset request for {email}: {e}")
