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


def get_all_travelling_advances(db: Session):
    return db.query(TravellingAdvance).all()


def update_travelling_advance(db: Session, advance_id: int, payload: dict):
    advance = get_travelling_advance(db, advance_id)
    if not advance:
        return None

    for field, value in payload.items():
        setattr(advance, field, value)

    db.commit()
    db.refresh(advance)
    return advance


def delete_travelling_advance(db: Session, advance_id: int) -> bool:
    advance = get_travelling_advance(db, advance_id)
    if not advance:
        return False

    db.delete(advance)
    db.commit()
    return True