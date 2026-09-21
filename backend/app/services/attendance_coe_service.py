from sqlalchemy.orm import Session

from app.repositories.attendance_coe_repository import (
    create_attendance_coe,
    delete_attendance_coe,
    get_attendance_coe,
    list_attendance_coe,
    update_attendance_coe,
)
from app.schemas.attendance_coe import (
    AttendanceCOECreate,
    AttendanceCOEUpdate,
)


def create_attendance_coe_service(
    db: Session,
    data: AttendanceCOECreate,
):
    return create_attendance_coe(db, data)


def get_attendance_coe_service(
    db: Session,
    coe_id: int,
):
    return get_attendance_coe(db, coe_id)


def list_attendance_coe_service(
    db: Session,
    attendance_id: int | None = None,
):
    return list_attendance_coe(
        db,
        attendance_id,
    )


def update_attendance_coe_service(
    db: Session,
    coe_id: int,
    data: AttendanceCOEUpdate,
):
    return update_attendance_coe(
        db,
        coe_id,
        data,
    )


def delete_attendance_coe_service(
    db: Session,
    coe_id: int,
):
    return delete_attendance_coe(
        db,
        coe_id,
    )