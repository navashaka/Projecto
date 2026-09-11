from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class OnEmploymentCreate(BaseModel):
    employee_refno_id: int

    employee_code: str | None = None
    designation: str | None = None
    department: str | None = None
    immediate_reporting_head: str | None = None
    department_head: str | None = None
    epf_uan: str | None = None
    esi: str | None = None
    health_insurance: str | None = None
    health_insurance_date: date | None = None
    work_email: str | None = None

    bank_account_name: str | None = None
    account_no: str | None = None
    bank: str | None = None
    branch: str | None = None
    ifsc: str | None = None

    salary_offered_ctc: Decimal | None = None
    yearly_increment: Decimal | None = None
    increment_year: int | None = None

    basic: Decimal | None = None
    allowance1: Decimal | None = None
    allowance2: Decimal | None = None
    allowance3: Decimal | None = None
    allowance4: Decimal | None = None
    allowance5: Decimal | None = None
    allowance6: Decimal | None = None
    other_allowance: Decimal | None = None

    arrears: Decimal | None = None
    gross: Decimal | None = None

    epf_deduction: Decimal | None = None
    esi_insurance_deduction: Decimal | None = None
    tds: Decimal | None = None
    canteen_deduction: Decimal | None = None
    advance_deduction: Decimal | None = None
    loan_emi: Decimal | None = None
    other_deduction: Decimal | None = None

    total_deductions: Decimal | None = None
    net_salary: Decimal | None = None

    epf_employer_share: Decimal | None = None
    esi_employer_share: Decimal | None = None
    insurance_employer_share: Decimal | None = None
    transport_allowance: Decimal | None = None
    canteen_allowance: Decimal | None = None
    bonus: Decimal | None = None
    other_employer_contribution: Decimal | None = None

    total_ctc: Decimal | None = None
