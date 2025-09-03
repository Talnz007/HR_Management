from pydantic import BaseModel

class DashboardStats(BaseModel):
    """
    Data Transfer Object for the admin dashboard statistics.
    """
    total_employees: int
    pending_leaves: int
    today_attendance: int
    monthly_payroll: float

    class Config:
        orm_mode = True