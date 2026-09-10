from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate


def create_user(db: Session, user_data: UserCreate):
    user = User(**user_data.model_dump())

    db.add(user)
    db.commit()
    db.refresh(user)

    return user