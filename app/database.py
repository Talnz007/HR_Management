from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

Base = declarative_base()

from app.models.user import User
from app.models.admin import Admin
from app.models.employee import Employee
from app.models.department import Department
from app.models.attendance import Attendance
from app.models.leave import Leave
from app.models.payroll import Payroll
from app.models.registration import Registration

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        db.execute(text("SET timezone = 'Asia/Karachi'"))  # Use text() for SQL expression
        yield db
    finally:
        db.close()