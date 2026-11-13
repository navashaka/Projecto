from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import Base
from app.modules.profile.repository import ProfileRepository


class ProfileService:

    @staticmethod
    def create(
        db: Session,
        model: type[Base],
        payload: BaseModel,
    ) -> Base:
        return ProfileRepository.create(db, model, payload)

    @staticmethod
    def get_all(db: Session, model: type[Base]) -> list[Base]:
        return ProfileRepository.get_all(db, model)

    @staticmethod
    def get_by_id(
        db: Session,
        model: type[Base],
        record_id: int,
    ) -> Base | None:
        return ProfileRepository.get_by_id(db, model, record_id)

    @staticmethod
    def update(
        db: Session,
        record: Base,
        payload: BaseModel,
    ) -> Base:
        return ProfileRepository.update(db, record, payload)

    @staticmethod
    def delete(db: Session, record: Base) -> None:
        ProfileRepository.delete(db, record)