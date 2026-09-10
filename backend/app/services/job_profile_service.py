from sqlalchemy.orm import Session

from app.models.job_profile import JobProfile
from app.repositories.job_profile_repository import (
    create_job_profile,
    get_job_profile,
)
from app.schemas.job_profile import JobProfileCreate


def create_job_profile_service(
    db: Session,
    data: JobProfileCreate,
):
    payload = data.model_dump() if hasattr(data, "model_dump") else data.dict()
    job_profile = JobProfile(**payload)

    return create_job_profile(db, job_profile)


def get_job_profile_service(
    db: Session,
    job_id: int,
):
    return get_job_profile(db, job_id)
