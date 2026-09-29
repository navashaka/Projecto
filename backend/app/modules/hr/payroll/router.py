from fastapi import APIRouter

from .schemas import (
    PayrollCalculateRequest,
    PayrollCalculationResponse,
)
from .service import calculate_payroll_service


router = APIRouter(
    prefix="/payroll",
    tags=["Payroll"],
)


@router.post(
    "/calculate",
    response_model=PayrollCalculationResponse,
)
def calculate_payroll(
    data: PayrollCalculateRequest,
):
    return calculate_payroll_service(data)