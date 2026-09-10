
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.user import UserCreate
from app.services.user_service import create_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/")
def create_user_api(
    user_data: UserCreate,
    db: Session = Depends(get_db),
):
    return create_user(db, user_data)