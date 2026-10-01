from sqlalchemy.orm import Session

from . import repository


def get_all_records(db: Session, model):
    return repository.get_all(db, model)


def get_record_by_id(
    db: Session,
    model,
    record_id: int,
):
    return repository.get_by_id(
        db,
        model,
        record_id,
    )


def create_record(
    db: Session,
    model,
    data: dict,
):
    return repository.create(
        db,
        model,
        data,
    )


def delete_record(
    db: Session,
    model,
    record_id: int,
):
    return repository.delete(
        db,
        model,
        record_id,
    )