from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.job_profile import JobProfileCreate, JobProfileUpdate
from app.services.job_profile_service import (
    create_job_profile_service,
    delete_job_profile_service,
    get_job_profile_service,
    list_job_profiles_service,
    update_job_profile_service,
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


@router.get("/")
def list_job_profiles(db: Session = Depends(get_db)):
    return list_job_profiles_service(db)


@router.get("/{job_id}")
def get_job_profile(
    job_id: int,
    db: Session = Depends(get_db),
):
    job_profile = get_job_profile_service(db, job_id)
    if not job_profile:
        raise HTTPException(status_code=404, detail="Job profile not found")
    return job_profile


@router.put("/{job_id}")
def update_job_profile(
    job_id: int,
    data: JobProfileUpdate,
    db: Session = Depends(get_db),
):
    job_profile = update_job_profile_service(db, job_id, data)
    if not job_profile:
        raise HTTPException(status_code=404, detail="Job profile not found")
    return job_profile


@router.delete("/{job_id}")
def delete_job_profile(job_id: int, db: Session = Depends(get_db)):
    if not delete_job_profile_service(db, job_id):
        raise HTTPException(status_code=404, detail="Job profile not found")
    return {"detail": "Job profile deleted"}
