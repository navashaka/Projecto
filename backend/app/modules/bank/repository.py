from typing import TypeVar

from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import Base

BankRecord = TypeVar("BankRecord", bound=Base)


class BankRepository:
    @staticmethod
    def create(db: Session, model: type[BankRecord], payload: BaseModel) -> BankRecord:
        try:
            record = model(**payload.model_dump(exclude_unset=True))
            db.add(record)
            db.commit()
            db.refresh(record)
            return record
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def get_all(db: Session, model: type[BankRecord]) -> list[BankRecord]:
        return db.query(model).all()

    @staticmethod
    def get_by_id(db: Session, model: type[BankRecord], record_id: int) -> BankRecord | None:
        return db.query(model).filter(model.id == record_id).first()

    @staticmethod
    def update(db: Session, record: BankRecord, payload: BaseModel) -> BankRecord:
        try:
            for field, value in payload.model_dump(exclude_unset=True).items():
                setattr(record, field, value)
            db.commit()
            db.refresh(record)
            return record
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def delete(db: Session, record: BankRecord) -> None:
        try:
            db.delete(record)
            db.commit()
        except Exception:
            db.rollback()
            raise