from sqlalchemy.orm import Session


def get_all(db: Session, model):
    return db.query(model).all()


def get_by_id(
    db: Session,
    model,
    record_id: int,
):
    return (
        db.query(model)
        .filter(model.id == record_id)
        .first()
    )


def create(
    db: Session,
    model,
    data: dict,
):
    record = model(**data)

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


def delete(
    db: Session,
    model,
    record_id: int,
):
    record = get_by_id(
        db,
        model,
        record_id,
    )

    if record is None:
        return None

    db.delete(record)
    db.commit()

    return record