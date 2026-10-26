from fastapi import APIRouter

router = APIRouter()

from app.hr.recruitment.router import router as recruitment_router

router.include_router(recruitment_router)