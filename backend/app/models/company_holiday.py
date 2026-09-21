from sqlalchemy import BigInteger, Column, Date, DateTime, String, func

from app.core.database import Base


class CompanyHoliday(Base):
    __tablename__ = "hr_company_holidays"

    id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    holiday_date = Column(
        Date,
        nullable=False,
    )

    holiday_name = Column(
        String(150),
        nullable=False,
    )

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