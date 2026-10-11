from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from .models import Country, Pincode
from .schemas import CountryResponse


router = APIRouter(
    prefix="/location",
    tags=["Location"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/countries", response_model=list[CountryResponse])
def get_countries(db: Session = Depends(get_db)):
    return (
        db.query(Country)
        .order_by(Country.country)
        .all()
    )


@router.get("/pincodes", response_model=list[str])
def get_pincodes(
    country_id: int = Query(...),
    search: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Pincode.pincode)
        .filter(Pincode.country_id == country_id)
    )

    if search:
        query = query.filter(
            Pincode.pincode.startswith(search)
        )

    rows = (
        query
        .distinct()
        .order_by(Pincode.pincode)
        .limit(limit)
        .all()
    )

    return [row[0] for row in rows]