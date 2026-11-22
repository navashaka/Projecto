from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, Numeric, String, Text

from app.core.database import Base


class ContraEntry(Base):
    __tablename__ = "gl_contra_entries"

    id = Column(Integer, primary_key=True)
    bank_cash_account_1 = Column(String(150), nullable=True)
    bank_cash_account_2 = Column(String(150), nullable=True)
    debit_amount = Column(Numeric(15, 2), nullable=True)
    credit_amount = Column(Numeric(15, 2), nullable=True)
    total = Column(Numeric(15, 2), nullable=True)


class JournalEntry(Base):
    __tablename__ = "gl_journal_vouchers"

    id = Column(Integer, primary_key=True)
    date = Column(Date, nullable=True)
    total = Column(Numeric(15, 2), nullable=True)


class JournalEntryItem(Base):
    __tablename__ = "gl_journal_voucher_items"

    id = Column(Integer, primary_key=True)
    voucher_id = Column(
        Integer,
        ForeignKey("gl_journal_vouchers.id", ondelete="CASCADE"),
        nullable=True,
    )
    gl_account = Column(String(150), nullable=True)
    debit_amount = Column(Numeric(15, 2), nullable=True)
    credit_amount = Column(Numeric(15, 2), nullable=True)
    cost_element = Column(String(150), nullable=True)


class CreditNote(Base):
    __tablename__ = "gl_credit_notes"

    id = Column(Integer, primary_key=True)
    credit_note_number = Column(String(50), nullable=True)
    date = Column(Date, nullable=True)
    party_name = Column(String(150), nullable=True)
    inventory_related = Column(Boolean, nullable=True)
    total = Column(Numeric(15, 2), nullable=True)
    rupees_in_words = Column(Text, nullable=True)


class CreditNoteItem(Base):
    __tablename__ = "gl_credit_note_items"

    id = Column(Integer, primary_key=True)
    credit_note_id = Column(
        Integer,
        ForeignKey("gl_credit_notes.id", ondelete="CASCADE"),
        nullable=True,
    )
    item = Column(String(150), nullable=True)
    hsn = Column(String(30), nullable=True)
    qty = Column(Numeric(15, 3), nullable=True)
    rate = Column(Numeric(15, 2), nullable=True)
    amount = Column(Numeric(15, 2), nullable=True)
    gst = Column(Numeric(15, 2), nullable=True)
    total_amount = Column(Numeric(15, 2), nullable=True)


class CreditNoteAccount(Base):
    __tablename__ = "gl_credit_note_accounts"

    id = Column(Integer, primary_key=True)
    credit_note_id = Column(
        Integer,
        ForeignKey("gl_credit_notes.id", ondelete="CASCADE"),
        nullable=True,
    )
    gl_account = Column(String(150), nullable=True)
    amount = Column(Numeric(15, 2), nullable=True)
    gst = Column(Numeric(15, 2), nullable=True)
    total_amount = Column(Numeric(15, 2), nullable=True)


class DebitNote(Base):
    __tablename__ = "gl_debit_notes"

    id = Column(Integer, primary_key=True)
    debit_note_number = Column(String(50), nullable=True)
    date = Column(Date, nullable=True)
    party_name = Column(String(150), nullable=True)
    inventory_related = Column(Boolean, nullable=True)
    total = Column(Numeric(15, 2), nullable=True)
    rupees_in_words = Column(Text, nullable=True)


class DebitNoteItem(Base):
    __tablename__ = "gl_debit_note_items"

    id = Column(Integer, primary_key=True)
    debit_note_id = Column(
        Integer,
        ForeignKey("gl_debit_notes.id", ondelete="CASCADE"),
        nullable=True,
    )
    item = Column(String(150), nullable=True)
    hsn = Column(String(30), nullable=True)
    qty = Column(Numeric(15, 3), nullable=True)
    rate = Column(Numeric(15, 2), nullable=True)
    amount = Column(Numeric(15, 2), nullable=True)
    gst = Column(Numeric(15, 2), nullable=True)
    total_amount = Column(Numeric(15, 2), nullable=True)


class DebitNoteAccount(Base):
    __tablename__ = "gl_debit_note_accounts"

    id = Column(Integer, primary_key=True)
    debit_note_id = Column(
        Integer,
        ForeignKey("gl_debit_notes.id", ondelete="CASCADE"),
        nullable=True,
    )
    gl_account = Column(String(150), nullable=True)
    amount = Column(Numeric(15, 2), nullable=True)
    gst = Column(Numeric(15, 2), nullable=True)
    total_amount = Column(Numeric(15, 2), nullable=True)


class CostElement(Base):
    __tablename__ = "gl_cost_elements"

    id = Column(Integer, primary_key=True)
    name = Column(String(150), nullable=False, unique=True)
    is_active = Column(Boolean, nullable=False, default=True, server_default="true")
