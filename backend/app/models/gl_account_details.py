from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    func,
)

from app.core.database import Base


class GLSundryCreditor(Base):
    __tablename__ = "gl_sundry_creditors"

    id = Column(Integer, primary_key=True)
    account_id = Column(
        ForeignKey("gl_accounts.id"),
        nullable=False,
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
    check_credit_days_on_voucher_entry = Column(
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


class GLSundryDebtor(Base):
    __tablename__ = "gl_sundry_debtors"

    id = Column(Integer, primary_key=True)
    account_id = Column(
        ForeignKey("gl_accounts.id"),
        nullable=False,
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
    check_credit_days_on_voucher_entry = Column(
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


class GLSecuredLoan(Base):
    __tablename__ = "gl_secured_loans"

    id = Column(Integer, primary_key=True)
    account_id = Column(
        ForeignKey("gl_accounts.id"),
        nullable=False,
    )
    loan_taken_date = Column(
        Date,
        nullable=True,
    )
    interest_rate = Column(
        Numeric,
        nullable=True,
    )
    interest_effective_date = Column(
        Date,
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


class GLUnsecuredLoan(Base):
    __tablename__ = "gl_unsecured_loans"

    id = Column(Integer, primary_key=True)
    account_id = Column(
        ForeignKey("gl_accounts.id"),
        nullable=False,
    )
    loan_taken_date = Column(
        Date,
        nullable=True,
    )
    interest_rate = Column(
        Numeric,
        nullable=True,
    )
    interest_effective_date = Column(
        Date,
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
