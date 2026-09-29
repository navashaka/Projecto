from decimal import Decimal

from .calculations import calculate_salary
from .schemas import (
    PayrollCalculateRequest,
    PayrollCalculationResponse,
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