from sqlalchemy import (
    Column,
    BigInteger,
    String,
    Date,
    DateTime,
    ForeignKey,
)
from sqlalchemy.sql import func

from app.core.database import Base


class Employment(Base):
    __tablename__ = "hr_employment_details"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("hr_userenquiry.id"), nullable=False)

    employee_code = Column(String(50))
    designation = Column(String(150))
    department = Column(String(150))
    immediate_reporting_head = Column(String(150))
    department_head = Column(String(150))
    location = Column(String(150))

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

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
    )