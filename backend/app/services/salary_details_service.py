from sqlalchemy.orm import Session

from app.models.salary_details import SalaryDetails
from app.repositories.salary_details_repository import (
    create_salary_details,
    get_salary_details,
)
from app.schemas.salary_details import SalaryDetailsCreate


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
