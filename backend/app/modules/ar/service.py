from collections.abc import Callable
import logging
from typing import Any, TypeVar

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import DeclarativeBase, Session

from . import repository


_INTEGRITY_CONFLICT = (
    "The AR record conflicts with existing data or references "
    "a record that does not exist."
)
_logger = logging.getLogger(__name__)
Result = TypeVar("Result")


def _run_write(db: Session, operation: Callable[[], Result]) -> Result:
    try:
        return operation()
    except IntegrityError as exc:
        db.rollback()
        diagnostic = getattr(exc.orig, "diag", None)
        constraint_name = getattr(diagnostic, "constraint_name", None)
        sqlstate = getattr(exc.orig, "sqlstate", None) or getattr(
            exc.orig,
            "pgcode",
            None,
        )
        _logger.warning(
            "AR database integrity error (constraint=%s, sqlstate=%s)",
            constraint_name,
            sqlstate,
        )
        if constraint_name == "ar_customers_activity_check":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "Activity must be Trader, Service Provider, "
                    "or Manufacturer."
                ),
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=_INTEGRITY_CONFLICT,
        ) from exc


def get_all_records(
    db: Session,
    model: type[DeclarativeBase],
) -> list[DeclarativeBase]:
    return repository.get_all(db, model)


def get_record_by_id(
    db: Session,
    model: type[DeclarativeBase],
    record_id: int,
) -> DeclarativeBase:
    record = repository.get_by_id(db, model, record_id)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AR record not found.",
        )
    return record


def create_record(
    db: Session,
    model: type[DeclarativeBase],
    data: dict[str, Any],
) -> DeclarativeBase:
    return _run_write(db, lambda: repository.create(db, model, data))


def update_record(
    db: Session,
    model: type[DeclarativeBase],
    record_id: int,
    data: dict[str, Any],
) -> DeclarativeBase:
    record = get_record_by_id(db, model, record_id)
    return _run_write(db, lambda: repository.update(db, record, data))


def delete_record(
    db: Session,
    model: type[DeclarativeBase],
    record_id: int,
) -> None:
    record = get_record_by_id(db, model, record_id)
    _run_write(db, lambda: repository.delete(db, record))
