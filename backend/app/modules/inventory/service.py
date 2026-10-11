from collections.abc import Callable
from typing import Any, TypeVar

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import DeclarativeBase, Session

from . import repository


_INTEGRITY_CONFLICT = (
    "The inventory record conflicts with existing data or references "
    "a record that does not exist."
)
Result = TypeVar("Result")


def _run_write(db: Session, operation: Callable[[], Result]) -> Result:
    try:
        return operation()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=_INTEGRITY_CONFLICT,
        ) from exc


def create_record(
    db: Session,
    model: type[DeclarativeBase],
    values: dict[str, Any],
) -> DeclarativeBase:
    return _run_write(db, lambda: repository.create_record(db, model, values))


def get_record(
    db: Session,
    model: type[DeclarativeBase],
    record_id: int,
) -> DeclarativeBase:
    record = repository.get_record(db, model, record_id)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory record not found.",
        )
    return record


def get_records(
    db: Session,
    model: type[DeclarativeBase],
) -> list[DeclarativeBase]:
    return repository.get_records(db, model)


def update_record(
    db: Session,
    model: type[DeclarativeBase],
    record_id: int,
    values: dict[str, Any],
) -> DeclarativeBase:
    record = get_record(db, model, record_id)
    return _run_write(
        db,
        lambda: repository.update_record(db, record, values),
    )


def delete_record(
    db: Session,
    model: type[DeclarativeBase],
    record_id: int,
) -> None:
    record = get_record(db, model, record_id)
    _run_write(db, lambda: repository.delete_record(db, record))