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
