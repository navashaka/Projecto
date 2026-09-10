from sqlalchemy.orm import Session

from app.models.employment import Employment
from app.schemas.employment import EmploymentCreate
from app.repositories.employment_repository import (
    create_employment,
    get_employment,
)


def create_employment_service(
    db: Session,
    data: EmploymentCreate,
):
    employment = Employment(**data.model_dump())

    return create_employment(db, employment)


def get_employment_service(
    db: Session,
    employment_id: int,
):
    return get_employment(db, employment_id)