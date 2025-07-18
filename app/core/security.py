# app/core/security.py
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
import logging
from redis import Redis
from typing import Optional, Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Redis connection for token revocation
redis_client = Redis(
    host=settings.redis_host,
    port=settings.redis_port,
    decode_responses=False,
    username=settings.redis_username,
    password=settings.redis_password
)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error(f"Password verification error: {str(e)}")
        raise

def get_password_hash(password: str) -> str:
    """Generate a hashed password."""
    try:
        return pwd_context.hash(password)
    except Exception as e:
        logger.error(f"Password hashing error: {str(e)}")
        raise

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode.update({"exp": expire, "type": "access"})
    try:
        encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
        logger.info(f"Access token created for user: {to_encode.get('sub')}")
        return encoded_jwt
    except Exception as e:
        logger.error(f"Access token creation error: {str(e)}")
        raise

def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=7))
    to_encode.update({"exp": expire, "type": "refresh"})
    try:
        encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
        logger.info(f"Refresh token created for user: {to_encode.get('sub')}")
        return encoded_jwt
    except Exception as e:
        logger.error(f"Refresh token creation error: {str(e)}")
        raise

def verify_token(token: str) -> Optional[str]:
    """Verify a JWT token and return the username."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        username: str = payload.get("sub")
        token_type: str = payload.get("type")
        if username is None or token_type is None:
            logger.warning("Invalid token: missing username or type")
            return None
        # Check if token is revoked
        if redis_client.get(f"revoked_token:{token}"):
            logger.warning(f"Revoked token used: {token}")
            return None
        return username
    except JWTError as e:
        logger.warning(f"Token verification failed: {str(e)}")
        return None

def revoke_token(token: str, expires: int) -> None:
    """Revoke a token by storing it in Redis with expiration."""
    try:
        redis_client.setex(f"revoked_token:{token}", expires, "true")
        logger.info(f"Token revoked: {token}")
    except Exception as e:
        logger.error(f"Token revocation error: {str(e)}")
        raise