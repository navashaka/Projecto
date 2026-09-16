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


def get_all_salary_details(db: Session):
    return db.query(SalaryDetails).all()


def update_salary_details(db: Session, salary_id: int, payload: dict):
    salary_details = get_salary_details(db, salary_id)
    if not salary_details:
        return None

    for field, value in payload.items():
        setattr(salary_details, field, value)

    db.commit()
    db.refresh(salary_details)
    return salary_details


def delete_salary_details(db: Session, salary_id: int) -> bool:
    salary_details = get_salary_details(db, salary_id)
    if not salary_details:
        return False

    db.delete(salary_details)
    db.commit()
    return True