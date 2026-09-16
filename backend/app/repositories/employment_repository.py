from sqlalchemy.orm import Session

from app.models.employment import Employment


def create_employment(
    db: Session,
    employment: Employment,
):
    db.add(employment)
    db.commit()
    db.refresh(employment)
    return employment


def get_employment(
    db: Session,
    employment_id: int,
):
    return (
        db.query(Employment)
        .filter(Employment.id == employment_id)
        .first()
    )


def get_all_employment(db: Session):
    return db.query(Employment).all()


def update_employment(db: Session, employment_id: int, payload: dict):
    employment = get_employment(db, employment_id)
    if not employment:
        return None

    for field, value in payload.items():
        setattr(employment, field, value)

    db.commit()
    db.refresh(employment)
    return employment


def delete_employment(db: Session, employment_id: int) -> bool:
    employment = get_employment(db, employment_id)
    if not employment:
        return False

    db.delete(employment)
    db.commit()
    return True