from sqlalchemy import Boolean, Column, Date, DateTime, Integer, String
from sqlalchemy.sql import func

from app.core.database import Base


class GLBankAccount(Base):
    __tablename__ = "gl_bank_accounts"

    id = Column(Integer, primary_key=True, autoincrement=True)

    account_holder_name = Column(String(150), nullable=False)
    account_number = Column(String(50), nullable=False)
    bank_name = Column(String(150), nullable=False)
    branch = Column(String(150), nullable=True)
    ifsc_code = Column(String(20), nullable=True)
    swift_code = Column(String(20), nullable=True)

    enable_cheque_issue = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    reconciliation_start_date = Column(
        Date,
        nullable=True,
    )

    enable_e_payments = Column(
        Boolean,
        nullable=False,
        default=False,
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