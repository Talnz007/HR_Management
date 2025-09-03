from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import date

from app.database import get_db
from app.models.employee import Employee
from app.models.leave import Leave
from app.models.attendance import Attendance
from app.models.payroll import Payroll
from app.schemas.admin import DashboardStats
from app.api.deps import get_current_admin_user  # CORRECTED IMPORT

router = APIRouter()


@router.get(
    "/dashboard-stats",
    response_model=DashboardStats,
    summary="Get Admin Dashboard Statistics",
    description="Retrieves aggregated statistics for the admin dashboard. Requires admin privileges.",
)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    # CORRECTED DEPENDENCY: Use get_current_admin_user
    # The return value is the user payload (dict), which we don't need to use directly here,
    # but its presence enforces the admin check.
    current_admin_payload: dict = Depends(get_current_admin_user),
):
    """
    Calculates and returns key statistics for the admin dashboard:
    - Total number of employees.
    - Number of pending leave requests.
    - Number of employees who have marked attendance today.
    - Total net pay for all payrolls ending in the current month.
    """
    total_employees = db.query(func.count(Employee.employee_id)).scalar() or 0
    
    pending_leaves = (
        db.query(func.count(Leave.leave_id))
        .filter(Leave.status == "pending")
        .scalar() or 0
    )

    today_attendance = (
        db.query(func.count(Attendance.attendance_id))
        .filter(Attendance.date == date.today())
        .scalar() or 0
    )

    # Calculate real monthly payroll by summing net_pay for payrolls ending in the current month.
    current_month = date.today().month
    current_year = date.today().year
    
    monthly_payroll = (
        db.query(func.sum(Payroll.net_pay))
        .filter(
            extract("year", Payroll.period_end) == current_year,
            extract("month", Payroll.period_end) == current_month,
        )
        .scalar() or 0.0
    )

    return DashboardStats(
        total_employees=total_employees,
        pending_leaves=pending_leaves,
        today_attendance=today_attendance,
        monthly_payroll=monthly_payroll,
    )