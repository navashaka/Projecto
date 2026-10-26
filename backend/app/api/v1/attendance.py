from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.attendance import (
    AttendanceCreate,
    AttendanceUpdate,
)
from app.services.attendance_service import (
    create_attendance_service,
    delete_attendance_service,
    get_attendance_service,
    list_attendance_service,
    update_attendance_service,
)
from app.services.employment_service import list_employment_service
from app.models.attendance import Attendance

router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"],
)


class AttendanceBulkRow(BaseModel):
    employee_code: str
    attendance_month: date

    cl: int = Field(default=0, ge=0)
    el: int = Field(default=0, ge=0)
    pl: int = Field(default=0, ge=0)
    lop: int = Field(default=0, ge=0)
    nh: int = Field(default=0, ge=0)
    sundays: int = Field(default=0, ge=0)
    other_paid_days: int = Field(default=0, ge=0)

    net_present_days: int = Field(ge=0)


class AttendanceBulkRequest(BaseModel):
    rows: list[AttendanceBulkRow] = Field(min_length=1)


@router.post("/bulk")
def create_attendance_bulk(
    payload: AttendanceBulkRequest,
    db: Session = Depends(get_db),
):
    try:
        employments = list_employment_service(db)

        employment_by_code = {
            str(item.employee_code).strip(): item
            for item in employments
            if getattr(item, "employee_code", None)
        }

        records = []

        for row in payload.rows:
            employment = employment_by_code.get(
                row.employee_code.strip()
            )

            if not employment:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Employee not found: "
                        f"{row.employee_code}"
                    ),
                )

            employee_code = getattr(
                employment,
                "employee_code",
                None,
            )

            if not employee_code:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"User ID missing for employee: "
                        f"{row.employee_code}"
                    ),
                )

            records.append(
                Attendance(
                    employee_code=employee_code,
                    attendance_month=row.attendance_month,
                    cl=row.cl,
                    el=row.el,
                    pl=row.pl,
                    lop=row.lop,
                    nh=row.nh,
                    sundays=row.sundays,
                    other_paid_days=row.other_paid_days,
                    net_present_days=row.net_present_days,
                )
            )

        db.add_all(records)
        db.commit()

        for record in records:
            db.refresh(record)

        return {
            "message": (
                f"{len(records)} attendance records "
                "saved successfully"
            ),
            "inserted_count": len(records),
            "records": [
                {
                    "id": record.id,
                    "employee_code": record.employee_code,
                    "attendance_month": (
                        record.attendance_month
                    ),
                    "cl": record.cl,
                    "el": record.el,
                    "pl": record.pl,
                    "lop": record.lop,
                    "nh": record.nh,
                    "sundays": record.sundays,
                    "other_paid_days": (
                        record.other_paid_days
                    ),
                    "net_present_days": (
                        record.net_present_days
                    ),
                }
                for record in records
            ],
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to save attendance records",
        ) from error


@router.post("/")
def create_attendance(
    data: AttendanceCreate,
    db: Session = Depends(get_db),
):
    return create_attendance_service(db, data)


@router.get("/")
def list_attendance(
    db: Session = Depends(get_db),
):
    return list_attendance_service(db)


@router.get("/{attendance_id}")
def get_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
):
    attendance = get_attendance_service(
        db,
        attendance_id,
    )

    if not attendance:
        raise HTTPException(
            status_code=404,
            detail="Attendance not found",
        )

    return attendance


@router.put("/{attendance_id}")
def update_attendance(
    attendance_id: int,
    data: AttendanceUpdate,
    db: Session = Depends(get_db),
):
    attendance = update_attendance_service(
        db,
        attendance_id,
        data,
    )

    if not attendance:
        raise HTTPException(
            status_code=404,
            detail="Attendance not found",
        )

    return attendance


@router.delete("/{attendance_id}")
def delete_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
):
    if not delete_attendance_service(
        db,
        attendance_id,
    ):
        raise HTTPException(
            status_code=404,
            detail="Attendance not found",
        )

    return {
        "detail": "Attendance deleted"
    }