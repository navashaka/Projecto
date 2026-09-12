from sqlalchemy import (
    Column,
    BigInteger,
    Integer,
    Numeric,
    DateTime,
    ForeignKey,
)
from sqlalchemy.sql import func

from app.core.database import Base


class SalaryDetails(Base):
    __tablename__ = "hr_salary_details"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("hr_userenquiry.id"), nullable=False)

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