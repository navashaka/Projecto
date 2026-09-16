from sqlalchemy.orm import Session

from app.models.travelling_advance import TravellingAdvance
from app.schemas.travelling_advance import (
    TravellingAdvanceCreate,
    TravellingAdvanceUpdate,
)
from app.repositories.travelling_advance_repository import (
    create_travelling_advance,
    delete_travelling_advance,
    get_all_travelling_advances,
    get_travelling_advance,
    update_travelling_advance,
)


def create_travelling_advance_service(
    db: Session,
    data: TravellingAdvanceCreate,
):
    advance = TravellingAdvance(**data.model_dump())

    return create_travelling_advance(db, advance)


def get_travelling_advance_service(
    db: Session,
    advance_id: int,
):
    return get_travelling_advance(db, advance_id)


def list_travelling_advances_service(db: Session):
    return get_all_travelling_advances(db)


def update_travelling_advance_service(
    db: Session,
    advance_id: int,
    data: TravellingAdvanceUpdate,
):
    return update_travelling_advance(
        db,
        advance_id,
        data.model_dump(exclude_unset=True),
    )


def delete_travelling_advance_service(db: Session, advance_id: int) -> bool:
    return delete_travelling_advance(db, advance_id)