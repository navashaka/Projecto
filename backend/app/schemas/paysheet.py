from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class PaysheetCreate(BaseModel):
    user_id: int
    salary_month: date

    employee_code: str | None = None
    employee_name: str | None = None
    designation: str | None = None
    department: str | None = None
    date_of_joining: date | None = None

    total_days: int | None = None
    present_days: int | None = None
    paid_days: int | None = None
    lop_days: int | None = None

    basic: Decimal = 0
    hra: Decimal = 0
    allowances: Decimal = 0
    other_earnings: Decimal = 0
    gross_earnings: Decimal = 0

    epf: Decimal = 0
    esi: Decimal = 0
    professional_tax: Decimal = 0
    tds: Decimal = 0
    advance_deduction: Decimal = 0
    other_deductions: Decimal = 0
    total_deductions: Decimal = 0

    net_salary: Decimal = 0


class PaysheetUpdate(BaseModel):
    salary_month: date | None = None

    total_days: int | None = None
    present_days: int | None = None
    paid_days: int | None = None
    lop_days: int | None = None

    basic: Decimal | None = None
    hra: Decimal | None = None
    allowances: Decimal | None = None
    other_earnings: Decimal | None = None
    gross_earnings: Decimal | None = None

    epf: Decimal | None = None
    esi: Decimal | None = None
    professional_tax: Decimal | None = None
    tds: Decimal | None = None
    advance_deduction: Decimal | None = None
    other_deductions: Decimal | None = None
    total_deductions: Decimal | None = None

    net_salary: Decimal | None = None