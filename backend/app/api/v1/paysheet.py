from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.paysheet import PaysheetCreate, PaysheetUpdate
from app.services.paysheet_service import (
    create_paysheet_service,
    delete_paysheet_service,
    get_paysheet_service,
    list_paysheets_service,
    update_paysheet_service,
)
from app.services.paysheet_calculation_service import (
    generate_paysheet_data,
)

router = APIRouter(
    prefix="/paysheets",
    tags=["Paysheet"],
)


@router.post("/")
def create_paysheet(
    data: PaysheetCreate,
    db: Session = Depends(get_db),
):
    return create_paysheet_service(db, data)


@router.get("/")
def list_paysheets(
    user_id: int | None = None,
    salary_month: date | None = None,
    db: Session = Depends(get_db),
):
    return list_paysheets_service(
        db,
        user_id,
        salary_month,
    )


@router.get("/calculate/{user_id}")
def calculate_paysheet(
    user_id: int,
    salary_month: date,
    db: Session = Depends(get_db),
):
    try:
        return generate_paysheet_data(
            db,
            user_id,
            salary_month,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        )


@router.get("/{paysheet_id}")
def get_paysheet(
    paysheet_id: int,
    db: Session = Depends(get_db),
):
    record = get_paysheet_service(
        db,
        paysheet_id,
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Paysheet not found",
        )

    return record


@router.put("/{paysheet_id}")
def update_paysheet(
    paysheet_id: int,
    data: PaysheetUpdate,
    db: Session = Depends(get_db),
):
    record = update_paysheet_service(
        db,
        paysheet_id,
        data,
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Paysheet not found",
        )

    return record


@router.delete("/{paysheet_id}")
def delete_paysheet(
    paysheet_id: int,
    db: Session = Depends(get_db),
):
    deleted = delete_paysheet_service(
        db,
        paysheet_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Paysheet not found",
        )

    return {
        "detail": "Paysheet deleted",
    }