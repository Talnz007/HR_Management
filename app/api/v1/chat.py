from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_current_admin_user, get_db
from app.models.user import User
from app.models.admin import Admin
from app.services.chat_service import ChatService, MessageType
from app.schemas.chat import (
    ChatSessionCreate, ChatSessionResponse, ChatMessageCreate,
    ChatMessageResponse, TempPasswordRequest
)

from fastapi import APIRouter, Request
from uuid import uuid4
from app.models.chat import ChatSession, ChatStatus
from app.schemas.chat import ChatSessionResponse
from app.api.deps import get_db

router = APIRouter()


@router.post("/sessions", response_model=ChatSessionResponse)
def create_chat_session(
        session_data: ChatSessionCreate,
        db: Session = Depends(get_db),
        current_user: dict = Depends(get_current_user)  # Fixed: It's a dict, not User
):
    """Create a new chat session for password reset."""
    user_id = current_user.get("user_id")

    # Check if user is admin by querying Admin table
    is_admin = db.query(Admin).filter(Admin.user_id == user_id).first() is not None

    # Allow if: user creating for themselves OR user is admin
    if session_data.employee_id != user_id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create chat session for this user"
        )

    chat_service = ChatService(db)
    session = chat_service.create_chat_session(session_data)
    return chat_service._build_session_response(session, user_id)


@router.get("/sessions", response_model=List[ChatSessionResponse])
def get_chat_sessions(
        db: Session = Depends(get_db),
        current_user: dict = Depends(get_current_user)  # Fixed: It's a dict, not User
):
    """Get chat sessions for current user."""
    user_id = current_user.get("user_id")
    is_admin = db.query(Admin).filter(Admin.user_id == user_id).first() is not None

    chat_service = ChatService(db)
    return chat_service.get_chat_sessions_for_user(user_id, is_admin)


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
def get_chat_session(
        session_id: UUID,
        db: Session = Depends(get_db),
        current_user: dict = Depends(get_current_user)  # Fixed: It's a dict, not User
):
    """Get specific chat session with messages."""
    user_id = current_user.get("user_id")
    is_admin = db.query(Admin).filter(Admin.user_id == user_id).first() is not None

    chat_service = ChatService(db)
    session = chat_service.get_chat_session(session_id, user_id, is_admin)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )

    return session


@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse)
def send_message(
        session_id: UUID,
        message_data: ChatMessageCreate,
        db: Session = Depends(get_db),
        current_user: dict = Depends(get_current_user)  # Fixed: It's a dict, not User
):
    """Send a message in a chat session."""
    if message_data.chat_session_id != session_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session ID mismatch"
        )

    chat_service = ChatService(db)
    message = chat_service.send_message(message_data, sender_id=current_user.get("user_id"))
    return chat_service._build_message_response(message)


@router.post("/guest-chat-session", response_model=ChatSessionResponse)
def create_guest_chat_session(request: Request, db: Session = Depends(get_db)):
    # Create a new chat session with no authenticated user (guest)
    session = ChatSession(
        id=uuid4(),
        password_reset_request_id=None,
        employee_id=None,  # Or create a dummy/anonymous user id
        admin_id=None,
        status=ChatStatus.active
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Optionally add a welcome system message here

    return session

@router.put("/sessions/{session_id}/assign")
def assign_admin_to_session(
        session_id: UUID,
        db: Session = Depends(get_db),
        current_user: dict = Depends(get_current_admin_user)  # Use admin dependency
):
    """Assign current admin user to chat session."""
    chat_service = ChatService(db)
    session = chat_service.assign_admin_to_session(session_id, current_user.get("user_id"))
    return {"message": "Successfully assigned to chat session"}


@router.put("/sessions/{session_id}/close")
def close_chat_session(
        session_id: UUID,
        db: Session = Depends(get_db),
        current_user: dict = Depends(get_current_user)  # Fixed: It's a dict, not User
):
    """Close a chat session."""
    user_id = current_user.get("user_id")
    is_admin = db.query(Admin).filter(Admin.user_id == user_id).first() is not None

    chat_service = ChatService(db)
    session = chat_service.close_chat_session(session_id, user_id, is_admin)
    return {"message": "Chat session closed successfully"}


@router.post("/temp-password")
def send_temp_password(
        request: TempPasswordRequest,
        db: Session = Depends(get_db),
        current_user: dict = Depends(get_current_admin_user)  # Use admin dependency
):
    """Generate and send temporary password through secure chat."""
    chat_service = ChatService(db)
    temp_password = chat_service.generate_temp_password(request, current_user.get("user_id"))
    return {"message": "Temporary password sent successfully"}


@router.get("/session/current", response_model=ChatSessionResponse)
def get_or_create_current_chat_session(
        db: Session = Depends(get_db),
        current_user: dict = Depends(get_current_user)
):
    """Get or create a general chat session for the current user."""
    user_id = current_user.get("user_id")

    # Look for existing general chat session (not tied to password reset)
    existing_session = db.query(ChatSession).filter(
        ChatSession.employee_id == user_id,
        ChatSession.password_reset_request_id.is_(None),  # General chat, not password reset
        ChatSession.status == ChatStatus.active
    ).first()

    if existing_session:
        chat_service = ChatService(db)
        return chat_service._build_session_response(existing_session, user_id, include_messages=True)

    # Create new general chat session
    # We need to modify the schema to make password_reset_request_id optional
    from uuid import uuid4
    general_session = ChatSession(
        id=uuid4(),
        password_reset_request_id=None,  # This will be None for general chats
        employee_id=user_id,
        admin_id=None,
        status=ChatStatus.active
    )

    db.add(general_session)
    db.commit()
    db.refresh(general_session)

    # Send welcome message
    welcome_message = ChatMessageCreate(
        chat_session_id=general_session.id,
        content="Hello! How can we help you today? An admin will respond to your message shortly.",
        message_type=MessageType.system
    )

    chat_service = ChatService(db)
    chat_service.send_message(welcome_message, system_sender=True)

    return chat_service._build_session_response(general_session, user_id, include_messages=True)

