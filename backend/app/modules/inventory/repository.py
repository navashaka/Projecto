from typing import Any

from sqlalchemy.orm import DeclarativeBase, Session


def create_record(
    db: Session,
    model: type[DeclarativeBase],
    values: dict[str, Any],
) -> DeclarativeBase:
    generated_fields = {
        column.name
        for column in model.__table__.columns
        if column.computed is not None
    }
    if generated_fields:
        values = {
            field: value
            for field, value in values.items()
            if field not in generated_fields
        }

    record = model(**values)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_record(
    db: Session,
    model: type[DeclarativeBase],
    record_id: int,
) -> DeclarativeBase | None:
    return db.get(model, record_id)


def get_records(
    db: Session,
    model: type[DeclarativeBase],
) -> list[DeclarativeBase]:
    return db.query(model).order_by(model.id).all()


def update_record(
    db: Session,
    record: DeclarativeBase,
    values: dict[str, Any],
) -> DeclarativeBase:
    for field, value in values.items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


def delete_record(db: Session, record: DeclarativeBase) -> None:
    db.delete(record)
    db.commit()