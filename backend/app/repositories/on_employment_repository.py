from sqlalchemy.orm import Session

from app.models.on_employment import OnEmployment


def create_on_employment(
    db: Session,
    on_employment: OnEmployment,
):
    db.add(on_employment)
    db.commit()
    db.refresh(on_employment)
    return on_employment


def get_on_employment(
    db: Session,
    employment_id: int,
):
    return (
        db.query(OnEmployment)
        .filter(OnEmployment.id == employment_id)
        .first()
    )


def get_all_on_employment(db: Session):
    return db.query(OnEmployment).all()


def update_on_employment(db: Session, employment_id: int, payload: dict):
    on_employment = get_on_employment(db, employment_id)
    if not on_employment:
        return None

    for field, value in payload.items():
        setattr(on_employment, field, value)

    db.commit()
    db.refresh(on_employment)
    return on_employment


def delete_on_employment(db: Session, employment_id: int) -> bool:
    on_employment = get_on_employment(db, employment_id)
    if not on_employment:
        return False

    db.delete(on_employment)
    db.commit()
    return True
