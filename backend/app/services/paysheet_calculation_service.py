from calendar import monthrange
from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.employment import Employment
from app.models.salary_details import SalaryDetails as Salary


def generate_paysheet_data(
    db: Session,
    user_id: int,
    salary_month: date,
):
    employment = (
        db.query(Employment)
        .filter(Employment.user_id == user_id)
        .order_by(Employment.id.desc())
        .first()
    )

    salary = (
        db.query(Salary)
        .filter(Salary.user_id == user_id)
        .order_by(Salary.id.desc())
        .first()
    )

    attendance = (
        db.query(Attendance)
        .filter(Attendance.user_id == user_id)
        .order_by(Attendance.id.desc())
        .first()
    )

    if not employment:
        raise ValueError(
            "Employment details not found"
        )

    if not salary:
        raise ValueError(
            "Salary details not found"
        )

    if not attendance:
        raise ValueError(
            "Attendance details not found"
        )

    total_days = monthrange(
        salary_month.year,
        salary_month.month,
    )[1]

    basic = Decimal(salary.basic or 0)

    hra = Decimal(salary.allowance1 or 0)

    allowances = sum(
        Decimal(value or 0)
        for value in [
            salary.allowance2,
            salary.allowance3,
            salary.allowance4,
            salary.allowance5,
            salary.allowance6,
            salary.other_allowance,
        ]
    )

    other_earnings = Decimal(
        salary.arrears or 0
    )

    gross_earnings = (
        basic
        + hra
        + allowances
        + other_earnings
    )

    epf = Decimal(
        salary.epf_deduction or 0
    )

    esi = Decimal(
        salary.esi_insurance_deduction or 0
    )

    tds = Decimal(
        salary.tds or 0
    )

    advance = Decimal(
        salary.advance_deduction or 0
    )

    other_deductions = (
        Decimal(
            salary.canteen_deduction or 0
        )
        + Decimal(
            salary.loan_emi or 0
        )
        + Decimal(
            salary.other_deduction or 0
        )
    )

    total_deductions = (
        epf
        + esi
        + tds
        + advance
        + other_deductions
    )

    net_salary = (
        gross_earnings
        - total_deductions
    )

    return {
        "user_id": user_id,
        "salary_month": salary_month,
        "employee_code": employment.employee_code,
        "employee_name": employment.bank_account_name,
        "designation": employment.designation,
        "department": employment.department,
        "date_of_joining": None,
        "total_days": total_days,
        "present_days": attendance.net_present_days,
        "paid_days": attendance.net_payable_days,
        "lop_days": attendance.lop,
        "basic": basic,
        "hra": hra,
        "allowances": allowances,
        "other_earnings": other_earnings,
        "gross_earnings": gross_earnings,
        "professional_tax": Decimal(0),
        "epf": epf,
        "esi": esi,
        "tds": tds,
        "advance_deduction": advance,
        "other_deductions": other_deductions,
        "total_deductions": total_deductions,
        "net_salary": net_salary,
    }