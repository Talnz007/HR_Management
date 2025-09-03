# app/socket_auth.py
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.config import settings
from app.socket import sio

@ sio.event
async def connect(sid, environ, auth):
    """Run once per socket connection."""
    token = (auth or {}).get("token")
    if not token:                       # reject if no token
        return False

    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
    except JWTError:
        return False                    # invalid token → disconnect

    db: Session = SessionLocal()
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        return False

    await sio.save_session(sid, {"user_id": user_id, "is_admin": user.is_admin})
    await sio.enter_room(sid, f"user:{user_id}")   # personal room
    if user.is_admin:
        await sio.enter_room(sid, "admins")        # shared admin room
