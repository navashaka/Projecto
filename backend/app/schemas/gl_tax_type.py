from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class GLTaxTypeCreate(BaseModel):
    name: str
    rate: Decimal
    effective_date: date
    gl_account_id: int | None = None
    is_active: bool = True


class GLTaxTypeUpdate(BaseModel):
    name: str | None = None
    rate: Decimal | None = None
    effective_date: date | None = None
    gl_account_id: int | None = None
    is_active: bool | None = None


class GLTaxTypeResponse(BaseModel):
    id: int
    name: str
    rate: Decimal
    effective_date: date
    gl_account_id: int | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)