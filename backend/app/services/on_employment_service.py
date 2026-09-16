from sqlalchemy.orm import Session

from app.models.on_employment import OnEmployment
from app.repositories.on_employment_repository import (
    create_on_employment,
    delete_on_employment,
    get_all_on_employment,
    get_on_employment,
    update_on_employment,
)
from app.schemas.on_employment import OnEmploymentCreate, OnEmploymentUpdate


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


def list_on_employment_service(db: Session):
    return get_all_on_employment(db)


def update_on_employment_service(
    db: Session,
    employment_id: int,
    data: OnEmploymentUpdate,
):
    return update_on_employment(
        db,
        employment_id,
        data.model_dump(exclude_unset=True),
    )


def delete_on_employment_service(db: Session, employment_id: int) -> bool:
    return delete_on_employment(db, employment_id)
