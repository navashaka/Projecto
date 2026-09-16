from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.travelling_advance import (
    TravellingAdvanceCreate,
    TravellingAdvanceUpdate,
)
from app.services.travelling_advance_service import (
    create_travelling_advance_service,
    delete_travelling_advance_service,
    get_travelling_advance_service,
    list_travelling_advances_service,
    update_travelling_advance_service,
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


@router.get("/")
def list_travelling_advances(db: Session = Depends(get_db)):
    return list_travelling_advances_service(db)


@router.get("/{advance_id}")
def get_travelling_advance(
    advance_id: int,
    db: Session = Depends(get_db),
):
    advance = get_travelling_advance_service(db, advance_id)
    if not advance:
        raise HTTPException(status_code=404, detail="Travelling advance not found")
    return advance


@router.put("/{advance_id}")
def update_travelling_advance(
    advance_id: int,
    data: TravellingAdvanceUpdate,
    db: Session = Depends(get_db),
):
    advance = update_travelling_advance_service(db, advance_id, data)
    if not advance:
        raise HTTPException(status_code=404, detail="Travelling advance not found")
    return advance


@router.delete("/{advance_id}")
def delete_travelling_advance(advance_id: int, db: Session = Depends(get_db)):
    if not delete_travelling_advance_service(db, advance_id):
        raise HTTPException(status_code=404, detail="Travelling advance not found")
    return {"detail": "Travelling advance deleted"}