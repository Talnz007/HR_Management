# app/main.py
from fastapi import FastAPI
from app.middleware.auth import AuthMiddleware
from app.core.logging import setup_logging
import logging
from sqladmin import Admin, ModelView
from sqlalchemy import create_engine
from app.database import get_db
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from fastapi.staticfiles import StaticFiles
from app.api.v1 import password_reset



logger = logging.getLogger(__name__)

app = FastAPI(
    title="HR Management System",
    description="Comprehensive HR system with employee, attendance, leave, and payroll management",
    version="1.0.0"
)
from app.config import settings
engine = create_engine(settings.database_url)
admin = Admin(app, engine)
from app.admin_views import (
    UserAdmin, EmployeeAdmin, DepartmentAdmin, PayrollAdmin
)

admin.add_view(UserAdmin)
admin.add_view(EmployeeAdmin)
admin.add_view(DepartmentAdmin)
admin.add_view(PayrollAdmin)

app.mount("/media", StaticFiles(directory=settings.MEDIA_ROOT), name="media")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify your frontend URL, e.g., "http://localhost"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
instrumentator = Instrumentator()
instrumentator.instrument(app).expose(app, endpoint="/metrics")
setup_logging()
# app.add_middleware(AuthMiddleware)  # Enable middleware
from app.api.v1 import auth, employees, attendance, leave, payroll, departments, users, password_reset, chat
app.include_router(auth.router, prefix="/auth")
app.include_router(employees.router, prefix="/employees")
app.include_router(attendance.router, prefix="/v1/attendance")
app.include_router(leave.router, prefix="/v1/leave")
app.include_router(payroll.router)
app.include_router(departments.router, prefix="/departments")
app.include_router(users.router)

app.include_router(password_reset.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the HR System API"}


from app.socket import sio           # import the shared server
import socketio

socket_app = socketio.ASGIApp(       # wrap FastAPI with Socket.IO
    sio,
    other_asgi_app=app               # ← THIS keeps all your REST routes working
)
