from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class BankSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class BankPassbookCreate(BankSchema):
    bank_name: str
    transaction_date: date | None = None
    bank_date: date | None = None
    reference_number: str | None = None
    cheque_number: str | None = None
    description: str | None = None
    debit_amount: Decimal | None = None
    credit_amount: Decimal | None = None
    balance_amount: Decimal | None = None
    is_reconciled: bool | None = None
    send_to_receipt: bool | None = None
    send_to_payment: bool | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class BankPassbookUpdate(BankSchema):
    bank_name: str | None = None
    transaction_date: date | None = None
    bank_date: date | None = None
    reference_number: str | None = None
    cheque_number: str | None = None
    description: str | None = None
    debit_amount: Decimal | None = None
    credit_amount: Decimal | None = None
    balance_amount: Decimal | None = None
    is_reconciled: bool | None = None
    send_to_receipt: bool | None = None
    send_to_payment: bool | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class BankPassbookRead(BankPassbookCreate):
    id: int


class BankBookCreate(BankSchema):
    bank_name: str
    voucher_date: date | None = None
    voucher_number: str | None = None
    gl_account: str | None = None
    description: str | None = None
    debit_amount: Decimal | None = None
    credit_amount: Decimal | None = None
    balance_amount: Decimal | None = None
    is_reconciled: bool | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class BankBookUpdate(BankSchema):
    bank_name: str | None = None
    voucher_date: date | None = None
    voucher_number: str | None = None
    gl_account: str | None = None
    description: str | None = None
    debit_amount: Decimal | None = None
    credit_amount: Decimal | None = None
    balance_amount: Decimal | None = None
    is_reconciled: bool | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class BankBookRead(BankBookCreate):
    id: int


class BankReceiptCreate(BankSchema):
    bank_passbook_id: int | None = None
    bank_name: str
    receipt_voucher_date: date
    bank_date: date | None = None
    total_bank_amount: Decimal | None = None
    total_debit_amount: Decimal | None = None
    description: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class BankReceiptUpdate(BankSchema):
    bank_passbook_id: int | None = None
    bank_name: str | None = None
    receipt_voucher_date: date | None = None
    bank_date: date | None = None
    total_bank_amount: Decimal | None = None
    total_debit_amount: Decimal | None = None
    description: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class BankReceiptRead(BankReceiptCreate):
    id: int


class BankReceiptItemCreate(BankSchema):
    receipt_id: int
    payer_gl_account: str
    bill_reference: str | None = None
    credit_amount: Decimal | None = None
    created_at: datetime | None = None


class BankReceiptItemUpdate(BankSchema):
    receipt_id: int | None = None
    payer_gl_account: str | None = None
    bill_reference: str | None = None
    credit_amount: Decimal | None = None
    created_at: datetime | None = None


class BankReceiptItemRead(BankReceiptItemCreate):
    id: int


class BankPaymentCreate(BankSchema):
    bank_passbook_id: int | None = None
    bank_name: str
    payment_voucher_date: date
    bank_date: date | None = None
    total_bank_amount: Decimal | None = None
    total_credit_amount: Decimal | None = None
    description: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class BankPaymentUpdate(BankSchema):
    bank_passbook_id: int | None = None
    bank_name: str | None = None
    payment_voucher_date: date | None = None
    bank_date: date | None = None
    total_bank_amount: Decimal | None = None
    total_credit_amount: Decimal | None = None
    description: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class BankPaymentRead(BankPaymentCreate):
    id: int


class BankPaymentItemCreate(BankSchema):
    payment_id: int
    recipient_gl_account: str
    bill_reference: str | None = None
    debit_amount: Decimal | None = None
    created_at: datetime | None = None


class BankPaymentItemUpdate(BankSchema):
    payment_id: int | None = None
    recipient_gl_account: str | None = None
    bill_reference: str | None = None
    debit_amount: Decimal | None = None
    created_at: datetime | None = None


class BankPaymentItemRead(BankPaymentItemCreate):
    id: int


class BankReconciliationCreate(BankSchema):
    bank_name: str
    closing_balance_bank_book: Decimal | None = None
    unreconciled_transaction_from_bank: Decimal | None = None
    unreconciled_transaction_from_bank_book: Decimal | None = None
    closing_balance_bank: Decimal | None = None
    reconciliation_date: date | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class BankReconciliationUpdate(BankSchema):
    bank_name: str | None = None
    closing_balance_bank_book: Decimal | None = None
    unreconciled_transaction_from_bank: Decimal | None = None
    unreconciled_transaction_from_bank_book: Decimal | None = None
    closing_balance_bank: Decimal | None = None
    reconciliation_date: date | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class BankReconciliationRead(BankReconciliationCreate):
    id: int