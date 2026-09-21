from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.attendance_coe import (
    AttendanceCOECreate,
    AttendanceCOEUpdate,
)
from app.services.attendance_coe_service import (
    create_attendance_coe_service,
    delete_attendance_coe_service,
    get_attendance_coe_service,
    list_attendance_coe_service,
    update_attendance_coe_service,
)

router = APIRouter(
    prefix="/attendance-coe",
    tags=["Attendance Cost of Elements"],
)


@router.post("/")
def create_attendance_coe(
    data: AttendanceCOECreate,
    db: Session = Depends(get_db),
):
    return create_attendance_coe_service(db, data)


@router.get("/")
def list_attendance_coe(
    attendance_id: int | None = None,
    db: Session = Depends(get_db),
):
    return list_attendance_coe_service(
        db,
        attendance_id,
    )


@router.get("/{coe_id}")
def get_attendance_coe(
    coe_id: int,
    db: Session = Depends(get_db),
):
    record = get_attendance_coe_service(
        db,
        coe_id,
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Attendance Cost of Elements not found",
        )

    return record


@router.put("/{coe_id}")
def update_attendance_coe(
    coe_id: int,
    data: AttendanceCOEUpdate,
    db: Session = Depends(get_db),
):
    record = update_attendance_coe_service(
        db,
        coe_id,
        data,
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Attendance Cost of Elements not found",
        )

    return record


@router.delete("/{coe_id}")
def delete_attendance_coe(
    coe_id: int,
    db: Session = Depends(get_db),
):
    if not delete_attendance_coe_service(
        db,
        coe_id,
    ):
        raise HTTPException(
            status_code=404,
            detail="Attendance Cost of Elements not found",
        )

    return {
        "detail": "Attendance Cost of Elements deleted"
    }