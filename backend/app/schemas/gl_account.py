from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class GLAccountCreate(BaseModel):
    name: str
    group_id: int
    tax_applicable: bool = False
    tax_type_id: int | None = None
    costing_applicable: bool = False

    hsn_sac_type: str | None = None
    hsn_id: int | None = None
    sac_id: int | None = None

    igst_rate: Decimal | None = None
    cgst_rate: Decimal | None = None
    sgst_rate: Decimal | None = None

    depreciation_applicable: bool = False
    loan_taken_date: date | None = None
    interest_rate: Decimal | None = None
    interest_effective_date: date | None = None
    maintain_bill_wise: bool = False
    default_credit_days: int | None = None
    check_credit_days_on_voucher: bool = False


class GLAccountResponse(BaseModel):
    id: int
    name: str
    group_id: int
    tax_applicable: bool
    tax_type_id: int | None
    costing_applicable: bool

    hsn_sac_type: str | None
    hsn_id: int | None
    sac_id: int | None

    igst_rate: Decimal | None
    cgst_rate: Decimal | None
    sgst_rate: Decimal | None

    depreciation_applicable: bool
    loan_taken_date: date | None
    interest_rate: Decimal | None
    interest_effective_date: date | None
    maintain_bill_wise: bool
    default_credit_days: int | None
    check_credit_days_on_voucher: bool
    is_active: bool

    class Config:
        from_attributes = True