from sqlalchemy import Column, Integer, DateTime, func
from app.core.database import Base


class Attendance(Base):
    __tablename__ = "hr_attendance"

    id = Column(Integer, primary_key=True, autoincrement=True)

    user_id = Column(Integer, nullable=False)

    cl = Column(Integer, default=0)
    el = Column(Integer, default=0)
    pl = Column(Integer, default=0)
    lop = Column(Integer, default=0)
    nh = Column(Integer, default=0)
    sundays = Column(Integer, default=0)
    other_paid_days = Column(Integer, default=0)
    net_present_days = Column(Integer, nullable=False)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )