from sqlalchemy import BigInteger, Boolean, Column, Date, DateTime, ForeignKey, Identity, Numeric, String, Text, text

from app.core.database import Base


class BankPassbook(Base):
    __tablename__ = "bank_passbook"

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    bank_name = Column(String(150), nullable=False)
    transaction_date = Column(Date, nullable=True)
    bank_date = Column(Date, nullable=True)
    reference_number = Column(String(100), nullable=True)
    cheque_number = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    debit_amount = Column(Numeric(15, 2), nullable=True, server_default=text("0"))
    credit_amount = Column(Numeric(15, 2), nullable=True, server_default=text("0"))
    balance_amount = Column(Numeric(15, 2), nullable=True, server_default=text("0"))
    is_reconciled = Column(Boolean, nullable=True, server_default=text("false"))
    send_to_receipt = Column(Boolean, nullable=True, server_default=text("false"))
    send_to_payment = Column(Boolean, nullable=True, server_default=text("false"))
    created_at = Column(DateTime(timezone=False), nullable=True, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime(timezone=False), nullable=True, server_default=text("CURRENT_TIMESTAMP"))


class BankBook(Base):
    __tablename__ = "bank_book"

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    bank_name = Column(String(150), nullable=False)
    voucher_date = Column(Date, nullable=True)
    voucher_number = Column(String(100), nullable=True)
    gl_account = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    debit_amount = Column(Numeric(15, 2), nullable=True, server_default=text("0"))
    credit_amount = Column(Numeric(15, 2), nullable=True, server_default=text("0"))
    balance_amount = Column(Numeric(15, 2), nullable=True, server_default=text("0"))
    is_reconciled = Column(Boolean, nullable=True, server_default=text("false"))
    created_at = Column(DateTime(timezone=False), nullable=True, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime(timezone=False), nullable=True, server_default=text("CURRENT_TIMESTAMP"))


class BankReceipt(Base):
    __tablename__ = "bank_receipt"

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    bank_passbook_id = Column(
        BigInteger,
        ForeignKey("bank_passbook.id", onupdate="NO ACTION", ondelete="NO ACTION"),
        nullable=True,
    )
    bank_name = Column(String(150), nullable=False)
    receipt_voucher_date = Column(Date, nullable=False)
    bank_date = Column(Date, nullable=True)
    total_bank_amount = Column(Numeric(15, 2), nullable=True, server_default=text("0"))
    total_debit_amount = Column(Numeric(15, 2), nullable=True, server_default=text("0"))
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=False), nullable=True, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime(timezone=False), nullable=True, server_default=text("CURRENT_TIMESTAMP"))


class BankReceiptItem(Base):
    __tablename__ = "bank_receipt_items"

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    receipt_id = Column(
        BigInteger,
        ForeignKey("bank_receipt.id", onupdate="NO ACTION", ondelete="CASCADE"),
        nullable=False,
    )
    payer_gl_account = Column(String(200), nullable=False)
    bill_reference = Column(String(200), nullable=True)
    credit_amount = Column(Numeric(15, 2), nullable=True, server_default=text("0"))
    created_at = Column(DateTime(timezone=False), nullable=True, server_default=text("CURRENT_TIMESTAMP"))


class BankPayment(Base):
    __tablename__ = "bank_payment"

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    bank_passbook_id = Column(
        BigInteger,
        ForeignKey("bank_passbook.id", onupdate="NO ACTION", ondelete="NO ACTION"),
        nullable=True,
    )
    bank_name = Column(String(150), nullable=False)
    payment_voucher_date = Column(Date, nullable=False)
    bank_date = Column(Date, nullable=True)
    total_bank_amount = Column(Numeric(15, 2), nullable=True, server_default=text("0"))
    total_credit_amount = Column(Numeric(15, 2), nullable=True, server_default=text("0"))
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=False), nullable=True, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime(timezone=False), nullable=True, server_default=text("CURRENT_TIMESTAMP"))


class BankPaymentItem(Base):
    __tablename__ = "bank_payment_items"

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    payment_id = Column(
        BigInteger,
        ForeignKey("bank_payment.id", onupdate="NO ACTION", ondelete="CASCADE"),
        nullable=False,
    )
    recipient_gl_account = Column(String(200), nullable=False)
    bill_reference = Column(String(200), nullable=True)
    debit_amount = Column(Numeric(15, 2), nullable=True, server_default=text("0"))
    created_at = Column(DateTime(timezone=False), nullable=True, server_default=text("CURRENT_TIMESTAMP"))


class BankReconciliation(Base):
    __tablename__ = "bank_reconciliation"

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    bank_name = Column(String(150), nullable=False)
    closing_balance_bank_book = Column(Numeric(15, 2), nullable=True, server_default=text("0"))
    unreconciled_transaction_from_bank = Column(Numeric(15, 2), nullable=True, server_default=text("0"))
    unreconciled_transaction_from_bank_book = Column(Numeric(15, 2), nullable=True, server_default=text("0"))
    closing_balance_bank = Column(Numeric(15, 2), nullable=True, server_default=text("0"))
    reconciliation_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=False), nullable=True, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime(timezone=False), nullable=True, server_default=text("CURRENT_TIMESTAMP"))