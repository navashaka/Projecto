from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import Base
from app.modules.bank.repository import BankRepository


class BankService:
    @staticmethod
    def create(db: Session, model: type[Base], payload: BaseModel) -> Base:
        return BankRepository.create(db, model, payload)

    @staticmethod
    def get_all(db: Session, model: type[Base]) -> list[Base]:
        return BankRepository.get_all(db, model)

    @staticmethod
    def get_by_id(db: Session, model: type[Base], record_id: int) -> Base | None:
        return BankRepository.get_by_id(db, model, record_id)

    @staticmethod
    def update(db: Session, record: Base, payload: BaseModel) -> Base:
        return BankRepository.update(db, record, payload)

    @staticmethod
    def delete(db: Session, record: Base) -> None:
        BankRepository.delete(db, record)