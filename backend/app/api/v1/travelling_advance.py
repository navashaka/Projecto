from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.travelling_advance import TravellingAdvanceCreate
from app.services.travelling_advance_service import (
    create_travelling_advance_service,
    get_travelling_advance_service,
)


router = APIRouter(
    prefix="/travelling-advance",
    tags=["Travelling Advance"],
)


@router.post("/")
def create_travelling_advance(
    data: TravellingAdvanceCreate,
    db: Session = Depends(get_db),
):
    return create_travelling_advance_service(db, data)


@router.get("/{advance_id}")
def get_travelling_advance(
    advance_id: int,
    db: Session = Depends(get_db),
):
    return get_travelling_advance_service(db, advance_id)