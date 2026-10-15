from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from .schemas import (
    PayrollCalculateRequest,
    PayrollCalculationResponse,
    PayrollCreateResponse,
)
from .service import calculate_payroll_service, create_payroll_service


router = APIRouter(
    prefix="/payroll",
    tags=["Payroll"],
)

@router.post(
    "/",
    response_model=PayrollCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_payroll(
    data: PayrollCalculateRequest,
    db: Session = Depends(get_db),
):
    return create_payroll_service(db, data)


@router.post(
    "/calculate",
    response_model=PayrollCalculationResponse,
)
def calculate_payroll(
    data: PayrollCalculateRequest,
):
    return calculate_payroll_service(data)