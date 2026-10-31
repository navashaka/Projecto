from sqlalchemy.orm import Session

from app.modules.purchase import repository


def create(db: Session, model, data: dict):
    return repository.create_record(db, model, data)


def get_all(db: Session, model):
    return repository.get_records(db, model)


def get_by_id(db: Session, model, record_id: int):
    return repository.get_record(db, model, record_id)


def update(db: Session, record, data: dict):
    return repository.update_record(db, record, data)


def delete(db: Session, record):
    return repository.delete_record(db, record)