from sqlalchemy import Column, BigInteger, String, Date, DateTime, func

from app.core.database import Base


class Employment(Base):
    __tablename__ = "hr_employment_details"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    user_id = Column(BigInteger, nullable=False)

    employee_code = Column(String(100), nullable=True)
    designation = Column(String(150), nullable=True)
    department = Column(String(150), nullable=True)

    immediate_reporting_head = Column(String(150), nullable=True)
    department_head = Column(String(150), nullable=True)

    location = Column(String(150), nullable=True)

    epf_uan = Column(String(100), nullable=True)
    esi = Column(String(100), nullable=True)

    health_insurance = Column(String(100), nullable=True)
    health_insurance_date = Column(Date, nullable=True)

    work_email = Column(String(150), nullable=True)

    bank_account_name = Column(String(150), nullable=True)

    # API field: account_no
    # Database column: account_number
    account_no = Column(
        "account_number",
        String(100),
        nullable=True,
    )

    bank = Column(String(150), nullable=True)
    branch = Column(String(150), nullable=True)
    ifsc = Column(String(50), nullable=True)

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