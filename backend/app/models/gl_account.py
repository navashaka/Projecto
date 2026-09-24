from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Integer,
    Numeric,
    String,
)
from sqlalchemy.sql import func

from app.core.database import Base


class GLAccount(Base):
    __tablename__ = "gl_accounts"

    id = Column(Integer, primary_key=True, autoincrement=True)

    name = Column(String(150), nullable=False)

    group_id = Column(Integer, nullable=False)

    tax_applicable = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    tax_type_id = Column(
        Integer,
        nullable=True,
    )

    costing_applicable = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    # Tax / HSN / SAC fields
    hsn_sac_type = Column(
        String(20),
        nullable=True,
    )

    hsn_id = Column(
        Integer,
        nullable=True,
    )

    sac_id = Column(
        Integer,
        nullable=True,
    )

    igst_rate = Column(
        Numeric(5, 2),
        nullable=True,
    )

    cgst_rate = Column(
        Numeric(5, 2),
        nullable=True,
    )

    sgst_rate = Column(
        Numeric(5, 2),
        nullable=True,
    )

    depreciation_applicable = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    loan_taken_date = Column(
        Date,
        nullable=True,
    )

    interest_rate = Column(
        Numeric(5, 2),
        nullable=True,
    )

    interest_effective_date = Column(
        Date,
        nullable=True,
    )

    maintain_bill_wise = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    default_credit_days = Column(
        Integer,
        nullable=True,
    )

    check_credit_days_on_voucher = Column(
        Boolean,
        nullable=False,
        default=False,
    )

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