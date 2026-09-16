from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.attendance import AttendanceCreate, AttendanceUpdate
from app.services.attendance_service import (
    create_attendance_service,
    delete_attendance_service,
    get_attendance_service,
    list_attendance_service,
    update_attendance_service,
)

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("/")
def create_attendance(
    data: AttendanceCreate,
    db: Session = Depends(get_db),
):
    return create_attendance_service(db, data)


@router.get("/")
def list_attendance(db: Session = Depends(get_db)):
    return list_attendance_service(db)


@router.get("/{attendance_id}")
def get_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
):
    attendance = get_attendance_service(db, attendance_id)
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance not found")
    return attendance


@router.put("/{attendance_id}")
def update_attendance(
    attendance_id: int,
    data: AttendanceUpdate,
    db: Session = Depends(get_db),
):
    attendance = update_attendance_service(db, attendance_id, data)
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance not found")
    return attendance


@router.delete("/{attendance_id}")
def delete_attendance(attendance_id: int, db: Session = Depends(get_db)):
    if not delete_attendance_service(db, attendance_id):
        raise HTTPException(status_code=404, detail="Attendance not found")
    return {"detail": "Attendance deleted"}