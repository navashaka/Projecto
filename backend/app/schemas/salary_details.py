from decimal import Decimal
from datetime import date

from pydantic import BaseModel


class SalaryDetailsCreate(BaseModel):
    user_id: int
    effective_date: date | None = None

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


class SalaryDetailsUpdate(BaseModel):
    user_id: int
    effective_date: date | None = None

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