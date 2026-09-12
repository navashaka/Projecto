from sqlalchemy import Column, BigInteger, Text, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class JobProfile(Base):
    __tablename__ = "hr_job_profile"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    job_description = Column(Text)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
    )
