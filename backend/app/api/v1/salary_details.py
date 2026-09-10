from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.salary_details import SalaryDetailsCreate
from app.services.salary_details_service import (
    create_salary_details_service,
    get_salary_details_service,
)


router = APIRouter(
    prefix="/salary-details",
    tags=["Salary Details"],
)


@router.post("/")
def create_salary_details(
    data: SalaryDetailsCreate,
    db: Session = Depends(get_db),
):
    return create_salary_details_service(db, data)


@router.get("/{salary_id}")
def get_salary_details(
    salary_id: int,
    db: Session = Depends(get_db),
):
    return get_salary_details_service(db, salary_id)
