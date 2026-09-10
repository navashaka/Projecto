from sqlalchemy.orm import Session

from app.models.job_profile import JobProfile


def create_job_profile(
    db: Session,
    job_profile: JobProfile,
):
    db.add(job_profile)
    db.commit()
    db.refresh(job_profile)
    return job_profile


def get_job_profile(
    db: Session,
    job_id: int,
):
    return (
        db.query(JobProfile)
        .filter(JobProfile.id == job_id)
        .first()
    )
