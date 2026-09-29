from decimal import Decimal

from pydantic import BaseModel, Field


class PayrollCalculateRequest(BaseModel):
    basic_salary: Decimal = Field(..., ge=0)
    allowances: Decimal = Field(default=Decimal("0"), ge=0)
    other_income: Decimal = Field(default=Decimal("0"), ge=0)
    tds: Decimal = Field(default=Decimal("0"), ge=0)
    other_deductions: Decimal = Field(
        default=Decimal("0"),
        ge=0,
    )


class PayrollCalculationResponse(BaseModel):
    gross_salary: Decimal
    employee_epf: Decimal
    employee_esi: Decimal
    total_deductions: Decimal
    net_salary: Decimal