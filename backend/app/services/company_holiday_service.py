from sqlalchemy.orm import Session

from app.repositories.company_holiday_repository import (
    create_company_holiday,
    delete_company_holiday,
    list_company_holidays,
)
from app.schemas.company_holiday import CompanyHolidayCreate


def create_company_holiday_service(
    db: Session,
    data: CompanyHolidayCreate,
):
    return create_company_holiday(db, data)


def list_company_holidays_service(
    db: Session,
):
    return list_company_holidays(db)


def delete_company_holiday_service(
    db: Session,
    holiday_id: int,
):
    return delete_company_holiday(
        db,
        holiday_id,
    )