# app/middleware/auth.py
from fastapi import FastAPI, Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.security import verify_token
import logging

logger = logging.getLogger(__name__)

class AuthMiddleware(BaseHTTPMiddleware):
    """Middleware to enforce authentication on protected routes."""
    def __init__(self, app: FastAPI, public_paths: list[str] = None):
        super().__init__(app)
        self.public_paths = public_paths or [
            "/docs", "/openapi.json", "/health", "/metrics", "/auth/login", "/auth/register", "/auth/refresh"
        ]

    async def dispatch(self, request: Request, call_next):
        if any(request.url.path.startswith(path) for path in self.public_paths):
            return await call_next(request)

        auth_header = request.headers.get("Authorization")
        if not auth_header:
            logger.warning("Missing Authorization header")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing Authorization header",
                headers={"WWW-Authenticate": "Bearer"}
            )

        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication scheme",
                    headers={"WWW-Authenticate": "Bearer"}
                )
            username = verify_token(token)
            if username is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired token",
                    headers={"WWW-Authenticate": "Bearer"}
                )
            request.state.user = username
        except ValueError:
            logger.warning("Invalid Authorization header format")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Authorization header format",
                headers={"WWW-Authenticate": "Bearer"}
            )

        response = await call_next(request)
        return response