from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.employment import EmploymentCreate
from app.services.employment_service import (
    create_employment_service,
    get_employment_service,
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


@router.get("/{employment_id}")
def get_employment(
    employment_id: int,
    db: Session = Depends(get_db),
):
    return get_employment_service(db, employment_id)