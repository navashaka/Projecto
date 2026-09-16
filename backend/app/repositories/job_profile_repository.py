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


def get_all_job_profiles(db: Session):
    return db.query(JobProfile).all()


def update_job_profile(db: Session, job_id: int, payload: dict):
    job_profile = get_job_profile(db, job_id)
    if not job_profile:
        return None

    for field, value in payload.items():
        setattr(job_profile, field, value)

    db.commit()
    db.refresh(job_profile)
    return job_profile


def delete_job_profile(db: Session, job_id: int) -> bool:
    job_profile = get_job_profile(db, job_id)
    if not job_profile:
        return False

    db.delete(job_profile)
    db.commit()
    return True
