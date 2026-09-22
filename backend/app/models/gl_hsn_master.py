from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.sql import func

from app.core.database import Base


class GLHSNMaster(Base):
    __tablename__ = "gl_hsn_master"

    id = Column(Integer, primary_key=True, autoincrement=True)

    chapter = Column(String(20), nullable=True)
    heading = Column(String(20), nullable=True)
    sub_heading = Column(String(20), nullable=True)

    hsn_code = Column(String(20), nullable=False)
    description = Column(Text, nullable=True)

    cgst_rate = Column(Numeric(5, 2), nullable=True)
    sgst_utgst_rate = Column(Numeric(5, 2), nullable=True)
    igst_rate = Column(Numeric(5, 2), nullable=True)
    compensation_cess = Column(Numeric(5, 2), nullable=True)

    effective_date = Column(Date, nullable=True)

    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )