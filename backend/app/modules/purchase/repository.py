from sqlalchemy.orm import Session


def create_record(db: Session, model, data: dict):
    record = model(**data)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_records(db: Session, model):
    return db.query(model).order_by(model.id.desc()).all()


def get_record(db: Session, model, record_id: int):
    return db.query(model).filter(model.id == record_id).first()


def update_record(db: Session, record, data: dict):
    for key, value in data.items():
        setattr(record, key, value)

    db.commit()
    db.refresh(record)
    return record


def delete_record(db: Session, record):
    db.delete(record)
    db.commit()
    return True