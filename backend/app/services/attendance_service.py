from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.repositories.attendance_repository import (
    create_attendance,
    delete_attendance,
    get_all_attendance,
    get_attendance,
    update_attendance,
)


def create_attendance_service(db: Session, data):
    
    payload = data.model_dump() if hasattr(data, "model_dump") else data.dict()
    attendance = Attendance(**payload)
    return create_attendance(db, attendance)


def get_attendance_service(db: Session, attendance_id: int):
    return get_attendance(db, attendance_id)


def list_attendance_service(db: Session):
    return get_all_attendance(db)


def update_attendance_service(db: Session, attendance_id: int, data):
    return update_attendance(
        db,
        attendance_id,
        data.model_dump(exclude_unset=True),
    )


def delete_attendance_service(db: Session, attendance_id: int) -> bool:
    return delete_attendance(db, attendance_id)