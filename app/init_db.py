# app/init_db.py
from sqlalchemy import create_engine
from app.database import Base, engine
from app.models.user import User
from app.models.department import Department
from app.models.employee import Employee
from app.models.attendance import Attendance
from app.models.payroll import Payroll
from app.models.admin import Admin
from app.models.registration import Registration
from app.models.leave import Leave



def init_db():
    try:
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully!")
    except Exception as e:
        print(f"Error creating tables: {e}")

if __name__ == "__main__":
    init_db()
