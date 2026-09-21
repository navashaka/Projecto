from sqlalchemy.orm import Session

from app.models.attendance_coe import AttendanceCOE
from app.schemas.attendance_coe import (
    AttendanceCOECreate,
    AttendanceCOEUpdate,
)


def create_attendance_coe(
    db: Session,
    data: AttendanceCOECreate,
):
    record = AttendanceCOE(
        **data.model_dump()
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


def get_attendance_coe(
    db: Session,
    coe_id: int,
):
    return (
        db.query(AttendanceCOE)
        .filter(AttendanceCOE.id == coe_id)
        .first()
    )


def list_attendance_coe(
    db: Session,
    attendance_id: int | None = None,
):
    query = db.query(AttendanceCOE)

    if attendance_id is not None:
        query = query.filter(
            AttendanceCOE.attendance_id
            == attendance_id
        )

    return query.order_by(
        AttendanceCOE.id
    ).all()


def update_attendance_coe(
    db: Session,
    coe_id: int,
    data: AttendanceCOEUpdate,
):
    record = get_attendance_coe(
        db,
        coe_id,
    )

    if not record:
        return None

    update_data = data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)

    return record


def delete_attendance_coe(
    db: Session,
    coe_id: int,
):
    record = get_attendance_coe(
        db,
        coe_id,
    )

    if not record:
        return False

    db.delete(record)
    db.commit()

    return True