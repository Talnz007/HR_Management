# app/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, timezone
import logging
from app.database import get_db
from app.schemas.user import UserCreate, UserResponse, Token
from app.models.user import User
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, revoke_token, verify_token
from app.api.deps import get_current_user
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["authentication"])

@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user with hashed password."""
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        logger.warning(f"Registration attempt with existing username: {user.username}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    db_email = db.query(User).filter(User.email == user.email).first()
    if db_email:
        logger.warning(f"Registration attempt with existing email: {user.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    db_phone = db.query(User).filter(User.phone == user.phone).first()
    if db_phone:
        logger.warning(f"Registration attempt with existing phone: {user.phone}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone already registered"
        )
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        phone=user.phone,
        password_hash=hashed_password,
        is_active=True,
        created_at=datetime.now(timezone.utc)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    logger.info(f"User registered: {user.username}")
    return db_user

@router.post("/login", response_model=Token)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Authenticate user and return access and refresh tokens."""
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        logger.warning(f"Failed login attempt for username: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(data={"sub": user.username, "user_id": str(user.user_id)}, expires_delta=access_token_expires)
    refresh_token = create_refresh_token(data={"sub": user.username, "user_id": str(user.user_id)})
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    logger.info(f"User logged in: {user.username}")
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.access_token_expire_minutes * 60
    }

@router.post("/refresh", response_model=Token)
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    """Refresh access token using a refresh token."""
    payload = verify_token(refresh_token)
    if payload is None:
        logger.warning("Invalid or expired refresh token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    username = payload.get("sub")
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(data={"sub": username, "user_id": payload.get("user_id")}, expires_delta=access_token_expires)
    logger.info(f"Access token refreshed for user: {username}")
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.access_token_expire_minutes * 60
    }

@router.post("/logout")
def logout_user(current_user: dict = Depends(get_current_user)):
    """Revoke the user's access and refresh tokens."""
    access_token = create_access_token(data={"sub": current_user.get("sub"), "user_id": current_user.get("user_id")}, expires_delta=timedelta(seconds=1))
    refresh_token = create_refresh_token(data={"sub": current_user.get("sub"), "user_id": current_user.get("user_id")}, expires_delta=timedelta(seconds=1))
    revoke_token(access_token, expires=3600)
    revoke_token(refresh_token, expires=604800)
    logger.info(f"User logged out: {current_user.get('sub')}")
    return {"detail": "Successfully logged out"}