from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.attendance import AttendanceCreate
from app.services.attendance_service import (
    create_attendance_service,
    get_attendance_service,
)

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("/")
def create_attendance(
    data: AttendanceCreate,
    db: Session = Depends(get_db),
):
    return create_attendance_service(db, data)


@router.get("/{attendance_id}")
def get_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
):
    return get_attendance_service(db, attendance_id)