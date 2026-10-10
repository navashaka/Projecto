from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class GLAccountLinkedCreate(BaseModel):
    account_id: int


class GLSundryCreditorCreate(GLAccountLinkedCreate):
    maintain_bill_wise: bool = False
    default_credit_days: int | None = None
    check_credit_days_on_voucher_entry: bool = False


class GLSundryCreditorResponse(GLSundryCreditorCreate):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GLSundryDebtorCreate(GLAccountLinkedCreate):
    maintain_bill_wise: bool = False
    default_credit_days: int | None = None
    check_credit_days_on_voucher_entry: bool = False


class GLSundryDebtorResponse(GLSundryDebtorCreate):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GLSecuredLoanCreate(GLAccountLinkedCreate):
    loan_taken_date: date | None = None
    interest_rate: Decimal | None = None
    interest_effective_date: date | None = None


class GLSecuredLoanResponse(GLSecuredLoanCreate):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GLUnsecuredLoanCreate(GLAccountLinkedCreate):
    loan_taken_date: date | None = None
    interest_rate: Decimal | None = None
    interest_effective_date: date | None = None


class GLUnsecuredLoanResponse(GLUnsecuredLoanCreate):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
