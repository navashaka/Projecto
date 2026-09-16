from sqlalchemy.orm import Session

from app.models.attendance import Attendance


def create_attendance(db: Session, attendance: Attendance) -> Attendance:
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    return attendance


def get_attendance(db: Session, attendance_id: int):
    return db.query(Attendance).filter(Attendance.id == attendance_id).first()


def get_all_attendance(db: Session):
    return db.query(Attendance).all()


def update_attendance(db: Session, attendance_id: int, payload: dict):
    attendance = get_attendance(db, attendance_id)
    if not attendance:
        return None

    for field, value in payload.items():
        setattr(attendance, field, value)

    db.commit()
    db.refresh(attendance)
    return attendance


def delete_attendance(db: Session, attendance_id: int) -> bool:
    attendance = get_attendance(db, attendance_id)
    if not attendance:
        return False

    db.delete(attendance)
    db.commit()
    return True