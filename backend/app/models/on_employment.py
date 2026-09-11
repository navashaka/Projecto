from sqlalchemy import (
    Column,
    BigInteger,
    String,
    Integer,
    Numeric,
    Date,
    DateTime,
    ForeignKey,
)
from sqlalchemy.sql import func

from app.core.database import Base


class OnEmployment(Base):
    __tablename__ = "on_employment_hr"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    employee_refno_id = Column(
        BigInteger,
        ForeignKey("users_hr.id"),
        nullable=False,
    )

    employee_code = Column(String(50))
    designation = Column(String(150))
    department = Column(String(150))
    immediate_reporting_head = Column(String(150))
    department_head = Column(String(150))
    epf_uan = Column(String(50))
    esi = Column(String(50))
    health_insurance = Column(String(150))
    health_insurance_date = Column(Date)
    work_email = Column(String(150))

    bank_account_name = Column(String(150))
    account_no = Column(String(50))
    bank = Column(String(150))
    branch = Column(String(150))
    ifsc = Column(String(20))

    salary_offered_ctc = Column(Numeric(12, 2))
    yearly_increment = Column(Numeric(12, 2))
    increment_year = Column(Integer)

    basic = Column(Numeric(12, 2))
    allowance1 = Column(Numeric(12, 2))
    allowance2 = Column(Numeric(12, 2))
    allowance3 = Column(Numeric(12, 2))
    allowance4 = Column(Numeric(12, 2))
    allowance5 = Column(Numeric(12, 2))
    allowance6 = Column(Numeric(12, 2))
    other_allowance = Column(Numeric(12, 2))

    arrears = Column(Numeric(12, 2))
    gross = Column(Numeric(12, 2))

    epf_deduction = Column(Numeric(12, 2))
    esi_insurance_deduction = Column(Numeric(12, 2))
    tds = Column(Numeric(12, 2))
    canteen_deduction = Column(Numeric(12, 2))
    advance_deduction = Column(Numeric(12, 2))
    loan_emi = Column(Numeric(12, 2))
    other_deduction = Column(Numeric(12, 2))

    total_deductions = Column(Numeric(12, 2))
    net_salary = Column(Numeric(12, 2))

    epf_employer_share = Column(Numeric(12, 2))
    esi_employer_share = Column(Numeric(12, 2))
    insurance_employer_share = Column(Numeric(12, 2))
    transport_allowance = Column(Numeric(12, 2))
    canteen_allowance = Column(Numeric(12, 2))
    bonus = Column(Numeric(12, 2))
    other_employer_contribution = Column(Numeric(12, 2))

    total_ctc = Column(Numeric(12, 2))

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
    )
