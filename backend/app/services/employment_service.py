from sqlalchemy.orm import Session

from app.models.employment import Employment
from app.schemas.employment import EmploymentCreate, EmploymentUpdate
from app.repositories.employment_repository import (
    create_employment,
    delete_employment,
    get_all_employment,
    get_employment,
    update_employment,
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


def list_employment_service(db: Session):
    return get_all_employment(db)


def update_employment_service(
    db: Session,
    employment_id: int,
    data: EmploymentUpdate,
):
    return update_employment(
        db,
        employment_id,
        data.model_dump(exclude_unset=True),
    )


def delete_employment_service(db: Session, employment_id: int) -> bool:
    return delete_employment(db, employment_id)