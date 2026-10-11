from typing import TypeVar

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.gl_account import GLAccount
from app.models.gl_account_details import (
    GLSecuredLoan,
    GLSundryCreditor,
    GLSundryDebtor,
    GLUnsecuredLoan,
)
from app.repositories.gl_account_details_repository import (
    create_record,
    delete_record,
    get_record,
    get_records,
    update_record,
)
from app.schemas.gl_account_details import GLAccountLinkedCreate

RecordT = TypeVar(
    "RecordT",
    GLSecuredLoan,
    GLSundryCreditor,
    GLSundryDebtor,
    GLUnsecuredLoan,
)


def validate_account(
    db: Session,
    data: GLAccountLinkedCreate,
) -> None:
    if db.get(GLAccount, data.account_id) is None:
        raise HTTPException(status_code=422, detail="GL Account not found.")


def create_account_detail(
    db: Session,
    model: type[RecordT],
    data: GLAccountLinkedCreate,
) -> RecordT:
    validate_account(db, data)
    return create_record(db, model, data.model_dump())


def get_account_details(
    db: Session,
    model: type[RecordT],
) -> list[RecordT]:
    return get_records(db, model)


def get_account_detail(
    db: Session,
    model: type[RecordT],
    record_id: int,
) -> RecordT | None:
    return get_record(db, model, record_id)


def update_account_detail(
    db: Session,
    model: type[RecordT],
    record_id: int,
    data: GLAccountLinkedCreate,
) -> RecordT | None:
    record = get_record(db, model, record_id)
    if record is None:
        return None

    validate_account(db, data)
    return update_record(db, record, data.model_dump())


def delete_account_detail(
    db: Session,
    model: type[RecordT],
    record_id: int,
) -> bool:
    record = get_record(db, model, record_id)
    if record is None:
        return False

    delete_record(db, record)
    return True
