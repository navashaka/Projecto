from datetime import date

from pydantic import BaseModel


class GLBankAccountCreate(BaseModel):
    account_holder_name: str
    account_number: str
    bank_name: str
    branch: str | None = None
    ifsc_code: str | None = None
    swift_code: str | None = None
    enable_cheque_issue: bool = False
    reconciliation_start_date: date | None = None
    enable_e_payments: bool = False


class GLBankAccountResponse(BaseModel):
    id: int
    account_holder_name: str
    account_number: str
    bank_name: str
    branch: str | None
    ifsc_code: str | None
    swift_code: str | None
    enable_cheque_issue: bool
    reconciliation_start_date: date | None
    enable_e_payments: bool

    class Config:
        from_attributes = True