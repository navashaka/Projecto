from typing import Any

from sqlalchemy.orm import DeclarativeBase, Session, selectinload

from .schemas import AR_CHILDREN


def get_all(db: Session, model: type[DeclarativeBase]) -> list[DeclarativeBase]:
    query = db.query(model)
    if model in AR_CHILDREN:
        query = query.options(selectinload(getattr(model, AR_CHILDREN[model][0])))
    return query.order_by(model.id).all()


def get_by_id(
    db: Session,
    model: type[DeclarativeBase],
    record_id: int,
) -> DeclarativeBase | None:
    query = db.query(model)
    if model in AR_CHILDREN:
        query = query.options(selectinload(getattr(model, AR_CHILDREN[model][0])))
    return query.filter(model.id == record_id).first()


def create(
    db: Session,
    model: type[DeclarativeBase],
    data: dict[str, Any],
) -> DeclarativeBase:
    values = dict(data)
    child_definition = AR_CHILDREN.get(model)
    child_values = None
    if child_definition:
        child_values = values.pop(child_definition[0], None)

    record = model(**values)
    if child_definition and child_values is not None:
        child_field, child_model, _ = child_definition
        setattr(
            record,
            child_field,
            [child_model(**item) for item in child_values],
        )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def update(
    db: Session,
    record: DeclarativeBase,
    data: dict[str, Any],
) -> DeclarativeBase:
    values = dict(data)
    child_definition = AR_CHILDREN.get(type(record))
    if child_definition:
        child_field, child_model, _ = child_definition
        child_values = values.pop(child_field, None)
        if child_values is not None:
            setattr(
                record,
                child_field,
                [child_model(**item) for item in child_values],
            )

    for field, value in values.items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


def delete(db: Session, record: DeclarativeBase) -> None:
    db.delete(record)
    db.commit()
