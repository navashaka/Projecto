from sqlalchemy import Column, Integer, String, Numeric, Date, Boolean, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class GLTaxType(Base):
    __tablename__ = "gl_tax_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    rate = Column(Numeric(5, 2), nullable=False)
    effective_date = Column(Date, nullable=False)
    gl_account_id = Column(Integer, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )