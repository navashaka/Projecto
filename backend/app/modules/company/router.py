from fastapi import APIRouter
from app.core.database import SessionLocal

from .schemas import CompanyCreate, CompanyResponse
from .repository import create_company


router = APIRouter(
    prefix="/company",
    tags=["Company"],
)


@router.post(
    "/create",
    response_model=CompanyResponse,
)
def create_company_api(data: CompanyCreate):
    db = SessionLocal()

    try:
        return create_company(
            db,
            data.model_dump(),
        )
    finally:
        db.close()