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