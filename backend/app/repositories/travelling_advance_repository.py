from sqlalchemy.orm import Session

from app.models.travelling_advance import TravellingAdvance


def create_travelling_advance(
    db: Session,
    data: TravellingAdvance,
):
    db.add(data)
    db.commit()
    db.refresh(data)
    return data


def get_travelling_advance(
    db: Session,
    advance_id: int,
):
    return (
        db.query(TravellingAdvance)
        .filter(TravellingAdvance.id == advance_id)
        .first()
    )