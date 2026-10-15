from decimal import Decimal

from sqlalchemy.orm import Session

from .calculations import calculate_salary
from .models import Payroll
from .repository import create_payroll
from .schemas import (
    PayrollCalculateRequest,
    PayrollCalculationResponse,
    PayrollCreateResponse,
)


def calculate_payroll_service(
    data: PayrollCalculateRequest,
) -> PayrollCalculationResponse:
    result = calculate_salary(
        basic_salary=data.basic_salary,
        allowances=data.allowances,
        other_income=data.other_income,
        tds=data.tds,
        other_deductions=data.other_deductions,
    )

    return PayrollCalculationResponse(
        gross_salary=Decimal(result["gross_salary"]),
        employee_epf=Decimal(result["employee_epf"]),
        employee_esi=Decimal(result["employee_esi"]),
        total_deductions=Decimal(result["total_deductions"]),
        net_salary=Decimal(result["net_salary"]),
    )


def create_payroll_service(
    db: Session,
    data: PayrollCalculateRequest,
) -> PayrollCreateResponse:
    calculation = calculate_payroll_service(data)
    payroll = create_payroll(
        db,
        Payroll(
            basic_salary=data.basic_salary,
            allowances=data.allowances,
            other_income=data.other_income,
            tds=data.tds,
            other_deductions=data.other_deductions,
            gross_salary=calculation.gross_salary,
            employee_epf=calculation.employee_epf,
            employee_esi=calculation.employee_esi,
            total_deductions=calculation.total_deductions,
            net_salary=calculation.net_salary,
        ),
    )
    return PayrollCreateResponse.model_validate(payroll)