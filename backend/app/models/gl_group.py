from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.sql import func

from app.core.database import Base


class GLGroup(Base):
    __tablename__ = "gl_groups"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    parent_group_id = Column(Integer, nullable=True)
    is_default = Column(Boolean, nullable=False, default=False)
    tax_applicable = Column(Boolean, nullable=False, default=False)
    costing_applicable = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)

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