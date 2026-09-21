from datetime import date

from pydantic import BaseModel, Field


class CompanyHolidayCreate(BaseModel):
    holiday_date: date
    holiday_name: str = Field(..., max_length=150)


class CompanyHolidayResponse(BaseModel):
    id: int
    holiday_date: date
    holiday_name: str

    class Config:
        from_attributes = True