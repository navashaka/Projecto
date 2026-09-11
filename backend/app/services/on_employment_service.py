from sqlalchemy.orm import Session

from app.models.on_employment import OnEmployment
from app.repositories.on_employment_repository import (
    create_on_employment,
    get_on_employment,
)
from app.schemas.on_employment import OnEmploymentCreate


def create_on_employment_service(
    db: Session,
    data: OnEmploymentCreate,
):
    payload = data.model_dump() if hasattr(data, "model_dump") else data.dict()
    on_employment = OnEmployment(**payload)

    return create_on_employment(db, on_employment)


def get_on_employment_service(
    db: Session,
    employment_id: int,
):
    return get_on_employment(db, employment_id)
