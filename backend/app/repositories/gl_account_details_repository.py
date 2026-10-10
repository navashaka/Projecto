from typing import TypeVar

from sqlalchemy.orm import Session

from app.core.database import Base

RecordT = TypeVar("RecordT", bound=Base)


def create_record(
    db: Session,
    model: type[RecordT],
    values: dict[str, object],
) -> RecordT:
    record = model(**values)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_records(
    db: Session,
    model: type[RecordT],
) -> list[RecordT]:
    return db.query(model).all()


def get_record(
    db: Session,
    model: type[RecordT],
    record_id: int,
) -> RecordT | None:
    return db.get(model, record_id)


def update_record(
    db: Session,
    record: RecordT,
    values: dict[str, object],
) -> RecordT:
    for field, value in values.items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


def delete_record(
    db: Session,
    record: RecordT,
) -> None:
    db.delete(record)
    db.commit()
