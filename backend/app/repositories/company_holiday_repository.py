from sqlalchemy.orm import Session

from app.models.company_holiday import CompanyHoliday
from app.schemas.company_holiday import CompanyHolidayCreate


def create_company_holiday(
    db: Session,
    data: CompanyHolidayCreate,
):
    record = CompanyHoliday(
        **data.model_dump(),
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


def list_company_holidays(
    db: Session,
):
    return (
        db.query(CompanyHoliday)
        .order_by(CompanyHoliday.holiday_date)
        .all()
    )


def delete_company_holiday(
    db: Session,
    holiday_id: int,
):
    record = (
        db.query(CompanyHoliday)
        .filter(
            CompanyHoliday.id == holiday_id,
        )
        .first()
    )

    if not record:
        return False

    db.delete(record)
    db.commit()

    return True