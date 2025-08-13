import secrets
from app.socketio_events import emit_new_message
import asyncio
import string
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from cryptography.fernet import Fernet
import os
from app.socket_emitter import emit_chat_message

from app.models.chat import ChatSession, ChatMessage, ChatStatus, MessageType
from app.models.user import User
from app.models.password_reset import PasswordResetRequest
from app.schemas.chat import (
    ChatSessionCreate, ChatSessionUpdate, ChatMessageCreate,
    ChatSessionResponse, ChatMessageResponse, TempPasswordRequest
)
from fastapi.exceptions import HTTPException


class ChatService:
    def __init__(self, db: Session):
        self.db = db
        self.encryption_key = os.getenv("CHAT_ENCRYPTION_KEY", Fernet.generate_key())
        self.fernet = Fernet(self.encryption_key)

    def create_chat_session(self, session_data: ChatSessionCreate) -> ChatSession:
        """Create a new chat session for password reset request."""
        # Check if session already exists for this request
        existing_session = self.db.query(ChatSession).filter(
            ChatSession.password_reset_request_id == session_data.password_reset_request_id,
            ChatSession.status == ChatStatus.active  # Use lowercase enum member
        ).first()

        if existing_session:
            return existing_session

        # Verify password reset request exists
        reset_request = self.db.query(PasswordResetRequest).filter(
            PasswordResetRequest.id == session_data.password_reset_request_id
        ).first()

        if not reset_request:
            raise HTTPException(status_code=404, detail="Password reset request not found")

        # Create session - SQLAlchemy will handle enum conversion automatically
        chat_session = ChatSession(
            password_reset_request_id=session_data.password_reset_request_id,
            employee_id=session_data.employee_id,
            admin_id=session_data.admin_id,
            status=ChatStatus.active  # Use lowercase enum member
        )

        self.db.add(chat_session)
        self.db.commit()
        self.db.refresh(chat_session)

        # Send system welcome message
        welcome_message = ChatMessageCreate(
            chat_session_id=chat_session.id,
            content="Chat session started. An admin will respond to your password reset request shortly.",
            message_type=MessageType.system  # Use lowercase enum member
        )
        self.send_message(welcome_message, system_sender=True)

        return chat_session

    def get_chat_sessions_for_user(self, user_id: UUID, is_admin: bool = False) -> List[ChatSessionResponse]:
        """Get chat sessions for a user (employee or admin)."""
        query = self.db.query(ChatSession)

        if is_admin:
            query = query.filter(
                or_(
                    ChatSession.admin_id == user_id,
                    and_(ChatSession.admin_id.is_(None), ChatSession.status == ChatStatus.active)
                )
            )
        else:
            query = query.filter(ChatSession.employee_id == user_id)

        sessions = query.order_by(desc(ChatSession.last_activity_at)).all()
        return [self._build_session_response(session, user_id) for session in sessions]

    def get_chat_session(self, session_id: UUID, user_id: UUID, is_admin: bool = False) -> Optional[
        ChatSessionResponse]:
        """Get a specific chat session with messages."""
        query = self.db.query(ChatSession).filter(ChatSession.id == session_id)

        if not is_admin:
            query = query.filter(ChatSession.employee_id == user_id)

        session = query.first()
        if not session:
            return None

        # Mark messages as read for this user
        self.db.query(ChatMessage).filter(
            ChatMessage.chat_session_id == session_id,
            ChatMessage.sender_id != user_id,
            ChatMessage.read_at.is_(None)
        ).update({"read_at": datetime.utcnow()})
        self.db.commit()

        return self._build_session_response(session, user_id, include_messages=True)

    def send_message(self, message_data: ChatMessageCreate, sender_id: Optional[UUID] = None,
                     system_sender: bool = False) -> ChatMessage:
        """Send a message in a chat session."""
        if system_sender:
            sender_id = None
        elif not sender_id:
            raise ValueError("sender_id is required for non-system messages")

        # Verify chat session exists and is active
        session = self.db.query(ChatSession).filter(
            ChatSession.id == message_data.chat_session_id,
            ChatSession.status == ChatStatus.active
        ).first()

        if not session:
            raise HTTPException(status_code=404, detail="Active chat session not found")

        # Create message
        message_dict = message_data.dict()
        message_dict["sender_id"] = sender_id

        # Encrypt sensitive content
        if message_data.message_type == MessageType.temp_password:
            message_dict["content"] = self._encrypt_content(message_dict["content"])
            message_dict["is_encrypted"] = False
            message_dict["expires_at"] = datetime.utcnow() + timedelta(hours=24)

        message = ChatMessage(**message_dict)
        self.db.add(message)

        # Update session last activity
        session.last_activity_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(message)

        # BUILD MESSAGE RESPONSE FOR SOCKET EMIT
        message_response = self._build_message_response(message)

        # EMIT TO SOCKET ROOM (NEW CODE)
        try:
            # Convert message_response to dict for socket emission
            message_dict_for_socket = {
                "id": str(message_response.id),
                "content": message_response.content,
                "sender_name": message_response.sender_name,
                "sender_role": message_response.sender_role,
                "message_type": message_response.message_type,
                "created_at": message_response.created_at.isoformat(),
                "expires_at": message_response.expires_at.isoformat() if message_response.expires_at else None,
                "chat_session_id": str(message_response.chat_session_id),
                "sender_id": str(message_response.sender_id) if message_response.sender_id else None,
                "is_encrypted": message_response.is_encrypted
            }

            # Emit the message via socket
            asyncio.create_task(emit_chat_message(str(session.id), message_dict))

        except Exception as e:
            print(f"Error emitting socket message: {e}")

        return message

    def assign_admin_to_session(self, session_id: UUID, admin_id: UUID) -> ChatSession:
        """Assign an admin to a chat session."""
        session = self.db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")

        session.admin_id = admin_id
        self.db.commit()
        self.db.refresh(session)

        # Send system message about assignment
        assignment_message = ChatMessageCreate(
            chat_session_id=session_id,
            content=f"Admin has joined the chat and will assist with your password reset request.",
            message_type=MessageType.system
        )
        self.send_message(assignment_message, system_sender=True)

        return session

    def close_chat_session(self, session_id: UUID, user_id: UUID, is_admin: bool = False) -> ChatSession:
        """Close a chat session."""
        query = self.db.query(ChatSession).filter(ChatSession.id == session_id)

        if not is_admin:
            query = query.filter(ChatSession.employee_id == user_id)

        session = query.first()
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")

        session.status = ChatStatus.closed  # Use lowercase enum member
        session.closed_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(session)

        return session

    def generate_temp_password(self, request: TempPasswordRequest, admin_id: UUID) -> str:
        """Generate and send a temporary password through secure chat."""
        # Generate secure temporary password
        temp_password = self._generate_secure_password(request.password_length)

        # Send encrypted message
        message_data = ChatMessageCreate(
            chat_session_id=request.chat_session_id,
            content=temp_password,
            message_type=MessageType.temp_password
        )

        self.send_message(message_data, sender_id=admin_id)

        return temp_password

    def _build_session_response(self, session: ChatSession, user_id: UUID,
                                include_messages: bool = False) -> ChatSessionResponse:
        """Build chat session response with user details."""
        # Get employee details (not just user details)
        from app.models.employee import Employee

        employee_user = self.db.query(User).filter(User.user_id == session.employee_id).first()
        employee = None
        if employee_user:
            employee = self.db.query(Employee).filter(Employee.user_id == session.employee_id).first()

        admin_user = None
        admin = None
        if session.admin_id:
            admin_user = self.db.query(User).filter(User.user_id == session.admin_id).first()
            admin = self.db.query(Employee).filter(Employee.user_id == session.admin_id).first()

        # Build employee name using Employee model data
        employee_name = "Unknown Employee"
        if employee:
            employee_name = f"{employee.first_name} {employee.last_name}"
        elif employee_user:
            employee_name = employee_user.username

        # Build admin name
        admin_name = None
        if admin:
            admin_name = f"{admin.first_name} {admin.last_name}"
        elif admin_user:
            admin_name = admin_user.username

        # Count unread messages
        unread_count = self.db.query(ChatMessage).filter(
            ChatMessage.chat_session_id == session.id,
            ChatMessage.sender_id != user_id,
            ChatMessage.read_at.is_(None)
        ).count()

        # Get latest message
        latest_message_obj = self.db.query(ChatMessage).filter(
            ChatMessage.chat_session_id == session.id
        ).order_by(desc(ChatMessage.created_at)).first()

        latest_message = None
        if latest_message_obj:
            latest_message = self._build_message_response(latest_message_obj)

        response_data = {
            "id": session.id,
            "password_reset_request_id": session.password_reset_request_id,
            "employee_id": session.employee_id,
            "admin_id": session.admin_id,
            "status": session.status,
            "created_at": session.created_at,
            "closed_at": session.closed_at,
            "last_activity_at": session.last_activity_at,
            "employee_name": employee_name,
            "admin_name": admin_name,
            "unread_count": unread_count,
            "latest_message": latest_message,
            "messages": []
        }

        if include_messages:
            messages = self.db.query(ChatMessage).filter(
                ChatMessage.chat_session_id == session.id
            ).order_by(ChatMessage.created_at).all()

            response_data["messages"] = [self._build_message_response(msg) for msg in messages]

        return ChatSessionResponse(**response_data)

    def _build_message_response(self, message: ChatMessage) -> ChatMessageResponse:
        """Build message response with sender details."""
        from app.models.employee import Employee

        sender_name = "System"
        sender_role = "system"

        if message.sender_id:  # Only query if sender_id is not None
            sender_user = self.db.query(User).filter(User.user_id == message.sender_id).first()
            sender_employee = None

            if sender_user:
                sender_employee = self.db.query(Employee).filter(Employee.user_id == message.sender_id).first()

                # Build sender name
                if sender_employee:
                    sender_name = f"{sender_employee.first_name} {sender_employee.last_name}"
                else:
                    sender_name = sender_user.username

                # Get sender role - check if they're an admin
                from app.models.admin import Admin
                is_admin = self.db.query(Admin).filter(Admin.user_id == message.sender_id).first()
                sender_role = "admin" if is_admin else "employee"

        content = message.content
        # Decrypt if needed and not expired
        if message.is_encrypted and message.message_type == MessageType.temp_password:
            if message.expires_at and datetime.now(timezone.utc) > message.expires_at:
                content = "[Temporary password has expired]"
            else:
                try:
                    content = self._decrypt_content(content)
                except:
                    content = "[Unable to decrypt message]"

        return ChatMessageResponse(
            id=message.id,
            chat_session_id=message.chat_session_id,
            sender_id=message.sender_id,
            message_type=message.message_type,
            content=content,
            is_encrypted=message.is_encrypted,
            read_at=message.read_at,
            created_at=message.created_at,
            expires_at=message.expires_at,
            sender_name=sender_name,
            sender_role=sender_role
        )

    def _encrypt_content(self, content: str) -> str:
        """Encrypt sensitive content."""
        return self.fernet.encrypt(content.encode()).decode()

    def _decrypt_content(self, encrypted_content: str) -> str:
        """Decrypt sensitive content."""
        return self.fernet.decrypt(encrypted_content.encode()).decode()

    def _generate_secure_password(self, length: int = 12) -> str:
        """Generate a secure temporary password."""
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        return ''.join(secrets.choice(alphabet) for _ in range(length))
