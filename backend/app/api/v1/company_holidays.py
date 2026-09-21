import csv
import io

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.company_holiday import CompanyHoliday
from app.schemas.company_holiday import (
    CompanyHolidayCreate,
    CompanyHolidayResponse,
)
from app.services.company_holiday_service import (
    create_company_holiday_service,
    delete_company_holiday_service,
    list_company_holidays_service,
)

router = APIRouter(
    prefix="/company-holidays",
    tags=["Company Holidays"],
)


@router.post(
    "/",
    response_model=CompanyHolidayResponse,
)
def create_company_holiday(
    data: CompanyHolidayCreate,
    db: Session = Depends(get_db),
):
    return create_company_holiday_service(
        db,
        data,
    )


@router.get(
    "/",
    response_model=list[CompanyHolidayResponse],
)
def list_company_holidays(
    db: Session = Depends(get_db),
):
    return list_company_holidays_service(db)


@router.delete("/{holiday_id}")
def delete_company_holiday(
    holiday_id: int,
    db: Session = Depends(get_db),
):
    deleted = delete_company_holiday_service(
        db,
        holiday_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Company holiday not found",
        )

    return {
        "detail": "Company holiday deleted",
    }


@router.post("/upload")
async def upload_company_holidays(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Please upload a CSV file",
        )

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are supported",
        )

    file_content = await file.read()

    try:
        text = file_content.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="CSV file must be UTF-8 encoded",
        )

    reader = csv.DictReader(
        io.StringIO(text)
    )

    required_columns = {
        "holiday_date",
        "holiday_name",
    }

    if not reader.fieldnames or not required_columns.issubset(
        set(reader.fieldnames)
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "CSV must contain "
                "holiday_date and holiday_name columns"
            ),
        )

    uploaded_count = 0

    try:
        for row in reader:
            holiday_date = (
                row.get("holiday_date") or ""
            ).strip()

            holiday_name = (
                row.get("holiday_name") or ""
            ).strip()

            if not holiday_date or not holiday_name:
                continue

            data = CompanyHolidayCreate(
                holiday_date=holiday_date,
                holiday_name=holiday_name,
            )

            create_company_holiday_service(
                db,
                data,
            )

            uploaded_count += 1

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=f"Unable to upload holiday list: {error}",
        )

    return {
        "message": "Company holiday list uploaded successfully",
        "uploaded_count": uploaded_count,
    }