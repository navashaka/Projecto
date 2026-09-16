from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.on_employment import OnEmploymentCreate, OnEmploymentUpdate
from app.services.on_employment_service import (
    create_on_employment_service,
    delete_on_employment_service,
    get_on_employment_service,
    list_on_employment_service,
    update_on_employment_service,
)


router = APIRouter(
    prefix="/on-employment",
    tags=["On Employment"],
)


@router.post("/")
def create_on_employment(
    data: OnEmploymentCreate,
    db: Session = Depends(get_db),
):
    return create_on_employment_service(db, data)


@router.get("/")
def list_on_employment(db: Session = Depends(get_db)):
    return list_on_employment_service(db)


@router.get("/{employment_id}")
def get_on_employment(
    employment_id: int,
    db: Session = Depends(get_db),
):
    on_employment = get_on_employment_service(db, employment_id)
    if not on_employment:
        raise HTTPException(status_code=404, detail="On-employment record not found")
    return on_employment


@router.put("/{employment_id}")
def update_on_employment(
    employment_id: int,
    data: OnEmploymentUpdate,
    db: Session = Depends(get_db),
):
    on_employment = update_on_employment_service(db, employment_id, data)
    if not on_employment:
        raise HTTPException(status_code=404, detail="On-employment record not found")
    return on_employment


@router.delete("/{employment_id}")
def delete_on_employment(employment_id: int, db: Session = Depends(get_db)):
    if not delete_on_employment_service(db, employment_id):
        raise HTTPException(status_code=404, detail="On-employment record not found")
    return {"detail": "On-employment record deleted"}
