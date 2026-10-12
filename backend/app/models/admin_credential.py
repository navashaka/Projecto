from sqlalchemy import Boolean, Column, DateTime, Integer, String, func

from app.core.database import Base


class AdminCredential(Base):
    __tablename__ = "admin_credentials"

    id = Column(Integer, primary_key=True, default=1)
    email = Column(String(254), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    must_change_password = Column(Boolean, nullable=False, default=True)
    token_version = Column(Integer, nullable=False, default=0)
    password_changed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
