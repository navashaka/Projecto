from sqlalchemy.orm import Session

from app.models.salary_details import SalaryDetails


def create_salary_details(
    db: Session,
    salary_details: SalaryDetails,
):
    db.add(salary_details)
    db.commit()
    db.refresh(salary_details)

    return salary_details


def get_salary_details(
    db: Session,
    salary_id: int,
):
    return (
        db.query(SalaryDetails)
        .filter(SalaryDetails.id == salary_id)
        .first()
    )