from sqlalchemy.orm import Session

from app.repositories.gl_od_limit_repository import (
    create_od_limit,
    get_od_limits,
    get_od_limit,
    update_od_limit,
    delete_od_limit,
)
from app.schemas.gl_od_limit import GLOdLimitCreate


def create_od_limit_service(
    db: Session,
    data: GLOdLimitCreate,
):
    return create_od_limit(db, data)


def get_od_limits_service(
    db: Session,
):
    return get_od_limits(db)


def get_od_limit_service(
    db: Session,
    od_limit_id: int,
):
    return get_od_limit(db, od_limit_id)


def update_od_limit_service(
    db: Session,
    od_limit_id: int,
    data: GLOdLimitCreate,
):
    return update_od_limit(db, od_limit_id, data)


def delete_od_limit_service(
    db: Session,
    od_limit_id: int,
):
    return delete_od_limit(db, od_limit_id)