from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from app.core.database import Base


class GLChequeRange(Base):
    __tablename__ = "gl_cheque_ranges"

    id = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    bank_account_id = Column(
        Integer,
        ForeignKey("gl_bank_accounts.id"),
        nullable=False,
    )

    from_number = Column(
        String(50),
        nullable=False,
    )

    to_number = Column(
        String(50),
        nullable=False,
    )

    cheque_image = Column(
        String,
        nullable=True,
    )

    default_company_name = Column(
        String(150),
        nullable=True,
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