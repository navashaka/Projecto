from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.job_profile import JobProfileCreate
from app.services.job_profile_service import (
    create_job_profile_service,
    get_job_profile_service,
)


router = APIRouter(
    prefix="/job-profile",
    tags=["Job Profile"],
)


@router.post("/")
def create_job_profile(
    data: JobProfileCreate,
    db: Session = Depends(get_db),
):
    return create_job_profile_service(db, data)


@router.get("/{job_id}")
def get_job_profile(
    job_id: int,
    db: Session = Depends(get_db),
):
    return get_job_profile_service(db, job_id)
