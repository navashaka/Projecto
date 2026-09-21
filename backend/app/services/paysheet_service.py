from sqlalchemy.orm import Session

from app.repositories.paysheet_repository import (
    create_paysheet,
    delete_paysheet,
    get_paysheet,
    list_paysheets,
    update_paysheet,
)
from app.schemas.paysheet import (
    PaysheetCreate,
    PaysheetUpdate,
)


def create_paysheet_service(
    db: Session,
    data: PaysheetCreate,
):
    return create_paysheet(db, data)


def get_paysheet_service(
    db: Session,
    paysheet_id: int,
):
    return get_paysheet(db, paysheet_id)


def list_paysheets_service(
    db: Session,
    user_id: int | None = None,
    salary_month=None,
):
    return list_paysheets(
        db,
        user_id,
        salary_month,
    )


def update_paysheet_service(
    db: Session,
    paysheet_id: int,
    data: PaysheetUpdate,
):
    return update_paysheet(
        db,
        paysheet_id,
        data,
    )


def delete_paysheet_service(
    db: Session,
    paysheet_id: int,
):
    return delete_paysheet(
        db,
        paysheet_id,
    )