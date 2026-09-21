from sqlalchemy import (
    BigInteger,
    Column,
    Date,
    DateTime,
    Integer,
    func,
)

from app.core.database import Base


class Attendance(Base):
    __tablename__ = "hr_attendance"

    id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    user_id = Column(
        BigInteger,
        nullable=False,
    )

    attendance_month = Column(
        Date,
        nullable=True,
    )

    cl = Column(
        Integer,
        default=0,
    )

    el = Column(
        Integer,
        default=0,
    )

    pl = Column(
        Integer,
        default=0,
    )

    lop = Column(
        Integer,
        default=0,
    )

    nh = Column(
        Integer,
        default=0,
    )

    sundays = Column(
        Integer,
        default=0,
    )

    other_paid_days = Column(
        Integer,
        default=0,
    )

    net_present_days = Column(
        Integer,
        nullable=False,
    )

    net_payable_days = Column(
        Integer,
        nullable=True,
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