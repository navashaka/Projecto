from sqlalchemy.orm import Session

from app.models.travelling_advance import TravellingAdvance
from app.schemas.travelling_advance import TravellingAdvanceCreate
from app.repositories.travelling_advance_repository import (
    create_travelling_advance,
    get_travelling_advance,
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