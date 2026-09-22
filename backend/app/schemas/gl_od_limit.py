from datetime import date, datetime

from pydantic import BaseModel


class GLOdLimitCreate(BaseModel):
    bank_account_id: int
    od_limit: float | None = None
    rate_of_interest: float | None = None
    effective_date: date | None = None


class GLOdLimitResponse(BaseModel):
    id: int
    bank_account_id: int
    od_limit: float | None
    rate_of_interest: float | None
    effective_date: date | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True