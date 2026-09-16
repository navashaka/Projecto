from sqlalchemy.orm import Session

from app.models.job_profile import JobProfile
from app.repositories.job_profile_repository import (
    create_job_profile,
    delete_job_profile,
    get_all_job_profiles,
    get_job_profile,
    update_job_profile,
)
from app.schemas.job_profile import JobProfileCreate, JobProfileUpdate


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


def list_job_profiles_service(db: Session):
    return get_all_job_profiles(db)


def update_job_profile_service(
    db: Session,
    job_id: int,
    data: JobProfileUpdate,
):
    return update_job_profile(
        db,
        job_id,
        data.model_dump(exclude_unset=True),
    )


def delete_job_profile_service(db: Session, job_id: int) -> bool:
    return delete_job_profile(db, job_id)
