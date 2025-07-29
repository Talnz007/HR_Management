from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.department import Department
from app.schemas.department import DepartmentResponse

router = APIRouter(tags=["departments"])

@router.get("/", response_model=List[DepartmentResponse])
def list_departments(db: Session = Depends(get_db)):
    """List all departments."""
    return db.query(Department).all()