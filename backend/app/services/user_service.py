
from sqlalchemy.orm import Session

from app.repositories.user_repository import create_user
from app.schemas.user import UserCreate


def create_user_service(db: Session, user_data: UserCreate):
    return create_user(db, user_data)