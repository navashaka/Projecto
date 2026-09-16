from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.salary_details import SalaryDetailsCreate, SalaryDetailsUpdate
from app.services.salary_details_service import (
    create_salary_details_service,
    delete_salary_details_service,
    get_salary_details_service,
    list_salary_details_service,
    update_salary_details_service,
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


@router.get("/")
def list_salary_details(db: Session = Depends(get_db)):
    return list_salary_details_service(db)


@router.get("/{salary_id}")
def get_salary_details(
    salary_id: int,
    db: Session = Depends(get_db),
):
    salary_details = get_salary_details_service(db, salary_id)
    if not salary_details:
        raise HTTPException(status_code=404, detail="Salary details not found")
    return salary_details


@router.put("/{salary_id}")
def update_salary_details(
    salary_id: int,
    data: SalaryDetailsUpdate,
    db: Session = Depends(get_db),
):
    salary_details = update_salary_details_service(db, salary_id, data)
    if not salary_details:
        raise HTTPException(status_code=404, detail="Salary details not found")
    return salary_details


@router.delete("/{salary_id}")
def delete_salary_details(salary_id: int, db: Session = Depends(get_db)):
    if not delete_salary_details_service(db, salary_id):
        raise HTTPException(status_code=404, detail="Salary details not found")
    return {"detail": "Salary details deleted"}
