from datetime import date as Date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class GLInput(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ContraEntryCreate(GLInput):
    bank_cash_account_1: str = Field(min_length=1, max_length=150)
    bank_cash_account_2: str = Field(min_length=1, max_length=150)
    debit_amount: Decimal = Field(gt=0, max_digits=15, decimal_places=2)
    credit_amount: Decimal = Field(gt=0, max_digits=15, decimal_places=2)
    total: Decimal = Field(gt=0, max_digits=15, decimal_places=2)


class ContraEntryUpdate(GLInput):
    bank_cash_account_1: str | None = Field(default=None, min_length=1, max_length=150)
    bank_cash_account_2: str | None = Field(default=None, min_length=1, max_length=150)
    debit_amount: Decimal | None = Field(default=None, gt=0, max_digits=15, decimal_places=2)
    credit_amount: Decimal | None = Field(default=None, gt=0, max_digits=15, decimal_places=2)
    total: Decimal | None = Field(default=None, gt=0, max_digits=15, decimal_places=2)


class JournalItemInput(GLInput):
    gl_account: str = Field(min_length=1, max_length=150)
    debit_amount: Decimal = Field(default=Decimal("0"), ge=0, max_digits=15, decimal_places=2)
    credit_amount: Decimal = Field(default=Decimal("0"), ge=0, max_digits=15, decimal_places=2)
    cost_element: str | None = Field(default=None, max_length=150)


class JournalEntryCreate(GLInput):
    date: Date
    total: Decimal = Field(gt=0, max_digits=15, decimal_places=2)
    items: list[JournalItemInput] = Field(min_length=2)


class JournalEntryUpdate(GLInput):
    date: Date | None = None
    total: Decimal | None = Field(default=None, gt=0, max_digits=15, decimal_places=2)
    items: list[JournalItemInput] | None = Field(default=None, min_length=2)


class NoteInventoryLine(GLInput):
    item: str = Field(min_length=1, max_length=150)
    hsn: str = Field(min_length=1, max_length=30)
    qty: Decimal = Field(gt=0, max_digits=15, decimal_places=3)
    rate: Decimal = Field(ge=0, max_digits=15, decimal_places=2)
    amount: Decimal = Field(ge=0, max_digits=15, decimal_places=2)
    gst: Decimal = Field(ge=0, max_digits=15, decimal_places=2)
    total_amount: Decimal = Field(ge=0, max_digits=15, decimal_places=2)


class NoteAccountLine(GLInput):
    gl_account: str = Field(min_length=1, max_length=150)
    amount: Decimal = Field(ge=0, max_digits=15, decimal_places=2)
    gst: Decimal = Field(ge=0, max_digits=15, decimal_places=2)
    total_amount: Decimal = Field(ge=0, max_digits=15, decimal_places=2)


class CreditNoteCreate(GLInput):
    credit_note_number: str = Field(min_length=1, max_length=50)
    date: Date
    party_name: str = Field(min_length=1, max_length=150)
    inventory_related: bool
    total: Decimal = Field(gt=0, max_digits=15, decimal_places=2)
    rupees_in_words: str = Field(min_length=1)
    items: list[NoteInventoryLine] = Field(default_factory=list)
    accounts: list[NoteAccountLine] = Field(default_factory=list)


class CreditNoteUpdate(GLInput):
    credit_note_number: str | None = Field(default=None, min_length=1, max_length=50)
    date: Date | None = None
    party_name: str | None = Field(default=None, min_length=1, max_length=150)
    inventory_related: bool | None = None
    total: Decimal | None = Field(default=None, gt=0, max_digits=15, decimal_places=2)
    rupees_in_words: str | None = Field(default=None, min_length=1)
    items: list[NoteInventoryLine] | None = None
    accounts: list[NoteAccountLine] | None = None


class DebitNoteCreate(GLInput):
    debit_note_number: str = Field(min_length=1, max_length=50)
    date: Date
    party_name: str = Field(min_length=1, max_length=150)
    inventory_related: bool
    total: Decimal = Field(gt=0, max_digits=15, decimal_places=2)
    rupees_in_words: str = Field(min_length=1)
    items: list[NoteInventoryLine] = Field(default_factory=list)
    accounts: list[NoteAccountLine] = Field(default_factory=list)


class DebitNoteUpdate(GLInput):
    debit_note_number: str | None = Field(default=None, min_length=1, max_length=50)
    date: Date | None = None
    party_name: str | None = Field(default=None, min_length=1, max_length=150)
    inventory_related: bool | None = None
    total: Decimal | None = Field(default=None, gt=0, max_digits=15, decimal_places=2)
    rupees_in_words: str | None = Field(default=None, min_length=1)
    items: list[NoteInventoryLine] | None = None
    accounts: list[NoteAccountLine] | None = None


class CostElementCreate(GLInput):
    name: str = Field(min_length=1, max_length=150)


class CostElementUpdate(GLInput):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    is_active: bool | None = None
