from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from sqlalchemy import func
from app.models.employment import Employment
from app.api.deps import get_db
from app.schemas.employment import EmploymentCreate, EmploymentUpdate
from app.services.employment_service import (
    create_employment_service,
    delete_employment_service,
    get_employment_service,
    list_employment_service,
    update_employment_service,
)


router = APIRouter(
    prefix="/employment",
    tags=["Employment"],
)


@router.post("/")
def create_employment(
    data: EmploymentCreate,
    db: Session = Depends(get_db),
):
    return create_employment_service(db, data)


@router.get("/")
def list_employment(db: Session = Depends(get_db)):
    return list_employment_service(db)


@router.get("/by-code/{employee_code}")
def get_employment_by_code(
    employee_code: str,
    db: Session = Depends(get_db),
):
    employment = (
        db.query(Employment)
        .filter(
            func.upper(func.trim(Employment.employee_code))
            == employee_code.strip().upper()
        )
        .first()
    )

    if employment is None:
        raise HTTPException(
            status_code=404,
            detail=f"Employee not found: {employee_code}",
        )

    return employment


@router.get("/{employment_id}")
def get_employment(
    employment_id: int,
    db: Session = Depends(get_db),
):
    employment = get_employment_service(db, employment_id)

    if not employment:
        raise HTTPException(
            status_code=404,
            detail="Employment not found",
        )

    return employment


@router.put("/{employment_id}")
def update_employment(
    employment_id: int,
    data: EmploymentUpdate,
    db: Session = Depends(get_db),
):
    employment = update_employment_service(
        db,
        employment_id,
        data,
    )

    if not employment:
        raise HTTPException(
            status_code=404,
            detail="Employment not found",
        )

    return employment


@router.delete("/{employment_id}")
def delete_employment(
    employment_id: int,
    db: Session = Depends(get_db),
):
    if not delete_employment_service(
        db,
        employment_id,
    ):
        raise HTTPException(
            status_code=404,
            detail="Employment not found",
        )

    return {
        "detail": "Employment deleted"
    }