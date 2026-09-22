from sqlalchemy.orm import Session

from app.models.gl_od_limit import GLOdLimit
from app.schemas.gl_od_limit import GLOdLimitCreate


def create_od_limit(
    db: Session,
    data: GLOdLimitCreate,
) -> GLOdLimit:
    od_limit = GLOdLimit(**data.model_dump())

    db.add(od_limit)
    db.commit()
    db.refresh(od_limit)

    return od_limit


def get_od_limits(
    db: Session,
) -> list[GLOdLimit]:
    return db.query(GLOdLimit).all()


def get_od_limit(
    db: Session,
    od_limit_id: int,
) -> GLOdLimit | None:
    return (
        db.query(GLOdLimit)
        .filter(GLOdLimit.id == od_limit_id)
        .first()
    )


def update_od_limit(
    db: Session,
    od_limit_id: int,
    data: GLOdLimitCreate,
) -> GLOdLimit | None:
    od_limit = get_od_limit(db, od_limit_id)

    if od_limit is None:
        return None

    for key, value in data.model_dump().items():
        setattr(od_limit, key, value)

    db.commit()
    db.refresh(od_limit)

    return od_limit


def delete_od_limit(
    db: Session,
    od_limit_id: int,
) -> bool:
    od_limit = get_od_limit(db, od_limit_id)

    if od_limit is None:
        return False

    db.delete(od_limit)
    db.commit()

    return True