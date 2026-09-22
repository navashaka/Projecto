from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class GLHSNMasterCreate(BaseModel):
    chapter: str | None = None
    heading: str | None = None
    sub_heading: str | None = None
    hsn_code: str
    description: str | None = None
    cgst_rate: Decimal | None = None
    sgst_utgst_rate: Decimal | None = None
    igst_rate: Decimal | None = None
    compensation_cess: Decimal | None = None
    effective_date: date | None = None


class GLHSNMasterResponse(BaseModel):
    id: int
    chapter: str | None
    heading: str | None
    sub_heading: str | None
    hsn_code: str
    description: str | None
    cgst_rate: Decimal | None
    sgst_utgst_rate: Decimal | None
    igst_rate: Decimal | None
    compensation_cess: Decimal | None
    effective_date: date | None
    is_active: bool

    class Config:
        from_attributes = True