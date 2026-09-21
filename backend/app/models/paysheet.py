from sqlalchemy import BigInteger, Column, Date, DateTime, Numeric, String, func

from app.core.database import Base


class Paysheet(Base):
    __tablename__ = "hr_paysheet"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, nullable=False)
    salary_month = Column(Date, nullable=False)

    employee_code = Column(String(100), nullable=True)
    employee_name = Column(String(150), nullable=True)
    designation = Column(String(150), nullable=True)
    department = Column(String(150), nullable=True)
    date_of_joining = Column(Date, nullable=True)

    total_days = Column(BigInteger, nullable=True)
    present_days = Column(BigInteger, nullable=True)
    paid_days = Column(BigInteger, nullable=True)
    lop_days = Column(BigInteger, nullable=True)

    basic = Column(Numeric(12, 2), default=0)
    hra = Column(Numeric(12, 2), default=0)
    allowances = Column(Numeric(12, 2), default=0)
    other_earnings = Column(Numeric(12, 2), default=0)
    gross_earnings = Column(Numeric(12, 2), default=0)

    epf = Column(Numeric(12, 2), default=0)
    esi = Column(Numeric(12, 2), default=0)
    professional_tax = Column(Numeric(12, 2), default=0)
    tds = Column(Numeric(12, 2), default=0)
    advance_deduction = Column(Numeric(12, 2), default=0)
    other_deductions = Column(Numeric(12, 2), default=0)
    total_deductions = Column(Numeric(12, 2), default=0)

    net_salary = Column(Numeric(12, 2), default=0)

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=True,
    )

    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=True,
    )