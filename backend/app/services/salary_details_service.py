from sqlalchemy.orm import Session

from app.models.salary_details import SalaryDetails
from app.repositories.salary_details_repository import (
    create_salary_details,
    delete_salary_details,
    get_all_salary_details,
    get_salary_details,
    update_salary_details,
)
from app.schemas.salary_details import SalaryDetailsCreate, SalaryDetailsUpdate


def create_salary_details_service(
    db: Session,
    data: SalaryDetailsCreate,
):
    payload = data.model_dump() if hasattr(data, "model_dump") else data.dict()
    salary_details = SalaryDetails(**payload)

    return create_salary_details(db, salary_details)


def get_salary_details_service(
    db: Session,
    salary_details_id: int,
):
    return get_salary_details(db, salary_details_id)


def list_salary_details_service(db: Session):
    return get_all_salary_details(db)


def update_salary_details_service(
    db: Session,
    salary_details_id: int,
    data: SalaryDetailsUpdate,
):
    return update_salary_details(
        db,
        salary_details_id,
        data.model_dump(exclude_unset=True),
    )


def delete_salary_details_service(db: Session, salary_details_id: int) -> bool:
    return delete_salary_details(db, salary_details_id)
