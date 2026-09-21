from sqlalchemy import BigInteger, Column, DateTime, Integer, Numeric, String, func

from app.core.database import Base


class AttendanceCOE(Base):
    __tablename__ = "attendance_coe"

    id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    attendance_id = Column(
        BigInteger,
        nullable=False,
    )

    item = Column(
        String(150),
        nullable=False,
    )

    worked_days = Column(
        Integer,
        nullable=False,
    )

    salary_per_day = Column(
        Numeric(12, 2),
        nullable=False,
    )

    amount = Column(
        Numeric(14, 2),
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