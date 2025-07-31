from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from app.database import get_db
from app.models.payroll import Payroll
from app.models.employee import Employee
from app.schemas.payroll import PayrollCreate, PayrollResponse
from app.api.deps import get_current_user, require_role, get_current_employee

router = APIRouter(prefix="/v1/payroll", tags=["Payroll"])


@router.get("/", response_model=List[PayrollResponse], dependencies=[Depends(require_role(["admin"]))])
async def get_payrolls(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    payrolls = db.query(Payroll).all()
    return payrolls


@router.get("/{payroll_id}", response_model=PayrollResponse, dependencies=[Depends(require_role(["admin"]))])
async def get_payroll(payroll_id: UUID, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    payroll = db.query(Payroll).filter(Payroll.payroll_id == payroll_id).first()
    if not payroll:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payroll not found")
    return payroll


@router.post("/", response_model=PayrollResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_role(["admin"]))])
async def create_payroll(payroll_data: PayrollCreate, db: Session = Depends(get_db),
                         current_user: dict = Depends(get_current_user)):
    # Verify employee exists
    employee = db.query(Employee).filter(Employee.employee_id == payroll_data.employee_id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    # Fetch base_salary from employee or require it in payload if NULL
    if employee.salary is not None:
        base_salary = float(employee.salary)
    else:
        if payroll_data.base_salary is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Base salary must be provided when employee has no salary set")
        base_salary = payroll_data.base_salary

    # Calculate net_pay
    overtime_pay = payroll_data.overtime_pay or 0.0
    deductions = payroll_data.deductions or 0.0
    net_pay = base_salary + overtime_pay - deductions

    # Create payroll object
    db_payroll = Payroll(
        employee_id=payroll_data.employee_id,
        period_start=payroll_data.period_start,
        period_end=payroll_data.period_end,
        base_salary=base_salary,
        overtime_pay=overtime_pay,
        deductions=deductions,
        net_pay=net_pay
    )

    db.add(db_payroll)
    db.commit()
    db.refresh(db_payroll)
    return db_payroll


@router.put("/{payroll_id}", response_model=PayrollResponse, dependencies=[Depends(require_role(["admin"]))])
async def update_payroll(payroll_id: UUID, payroll_data: PayrollCreate, db: Session = Depends(get_db),
                         current_user: dict = Depends(get_current_user)):
    db_payroll = db.query(Payroll).filter(Payroll.payroll_id == payroll_id).first()
    if not db_payroll:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payroll not found")

    # Verify employee exists
    employee = db.query(Employee).filter(Employee.employee_id == payroll_data.employee_id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    # Fetch base_salary from employee or require it in payload if NULL
    if employee.salary is not None:
        base_salary = float(employee.salary)
    else:
        if payroll_data.base_salary is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Base salary must be provided when employee has no salary set")
        base_salary = payroll_data.base_salary

    # Calculate net_pay
    overtime_pay = payroll_data.overtime_pay or 0.0
    deductions = payroll_data.deductions or 0.0
    net_pay = base_salary + overtime_pay - deductions

    # Update payroll fields
    update_data = {
        "employee_id": payroll_data.employee_id,
        "period_start": payroll_data.period_start,
        "period_end": payroll_data.period_end,
        "base_salary": base_salary,
        "overtime_pay": overtime_pay,
        "deductions": deductions,
        "net_pay": net_pay
    }

    for key, value in update_data.items():
        setattr(db_payroll, key, value)

    db.commit()
    db.refresh(db_payroll)
    return db_payroll


@router.get("/me", response_model=List[PayrollResponse])
def get_my_payrolls(
        db: Session = Depends(get_db),
        current_employee: Employee = Depends(get_current_employee)
):
    """
    Retrieve all payroll records for the current logged-in employee.
    """
    payrolls = db.query(Payroll).filter(Payroll.employee_id == current_employee.employee_id).all()
    if not payrolls:
        return []
    return payrolls


@router.delete("/{payroll_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_role(["admin"]))])
async def delete_payroll(payroll_id: UUID, db: Session = Depends(get_db),
                         current_user: dict = Depends(get_current_user)):
    db_payroll = db.query(Payroll).filter(Payroll.payroll_id == payroll_id).first()
    if not db_payroll:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payroll not found")

    db.delete(db_payroll)
    db.commit()
    return None