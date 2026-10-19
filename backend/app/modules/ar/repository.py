from typing import Any

from sqlalchemy.orm import DeclarativeBase, Session, selectinload

from .schemas import AR_CHILDREN


def _load_children(query, model: type[DeclarativeBase]):
    child_definition = AR_CHILDREN.get(model)
    if child_definition:
        query = query.options(
            selectinload(getattr(model, child_definition[0]))
        )
    return query


def get_all(
    db: Session,
    model: type[DeclarativeBase],
) -> list[DeclarativeBase]:
    query = _load_children(db.query(model), model)
    return query.order_by(model.id).all()


def get_by_id(
    db: Session,
    model: type[DeclarativeBase],
    record_id: int,
) -> DeclarativeBase | None:
    query = _load_children(db.query(model), model)
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
        child_field, child_model, _ = child_definition
        child_values = values.pop(child_field, None)

    record = model(**values)

    if child_definition and child_values is not None:
        child_field, child_model, _ = child_definition
        setattr(
            record,
            child_field,
            [child_model(**item) for item in child_values],
        )

    db.add(record)
    db.flush()
    db.commit()
    db.refresh(record)

    if child_definition:
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

    db.add(record)
    db.flush()
    db.commit()
    db.refresh(record)

    return record


def delete(
    db: Session,
    record: DeclarativeBase,
) -> None:
    db.delete(record)
    db.commit()