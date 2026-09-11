from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.on_employment import OnEmploymentCreate
from app.services.on_employment_service import (
    create_on_employment_service,
    get_on_employment_service,
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


@router.get("/{employment_id}")
def get_on_employment(
    employment_id: int,
    db: Session = Depends(get_db),
):
    return get_on_employment_service(db, employment_id)
