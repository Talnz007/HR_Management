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
    UserAdmin, EmployeeAdmin, DepartmentAdmin
)

admin.add_view(UserAdmin)
admin.add_view(EmployeeAdmin)
admin.add_view(DepartmentAdmin)

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # Or specify your frontend URL, e.g., "http://localhost"
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )
instrumentator = Instrumentator()
instrumentator.instrument(app).expose(app, endpoint="/metrics")
setup_logging()
app.add_middleware(AuthMiddleware)  # Enable middleware
from app.api.v1 import auth, employees, attendance, leave
app.include_router(auth.router, prefix="/auth")
app.include_router(employees.router, prefix="/employees")
app.include_router(attendance.router, prefix="/v1/attendance")
app.include_router(leave.router, prefix="/v1/leave")

@app.get("/")
def read_root():
    return {"message": "Welcome to the HR System API"}