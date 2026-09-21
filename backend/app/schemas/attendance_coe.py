from decimal import Decimal

from pydantic import BaseModel, Field


class AttendanceCOECreate(BaseModel):
    attendance_id: int

    item: str = Field(
        ...,
        max_length=150,
    )

    worked_days: int = Field(
        ...,
        ge=0,
    )

    salary_per_day: Decimal = Field(
        ...,
        ge=0,
    )

    amount: Decimal = Field(
        ...,
        ge=0,
    )


class AttendanceCOEUpdate(BaseModel):
    attendance_id: int | None = None

    item: str | None = Field(
        default=None,
        max_length=150,
    )

    worked_days: int | None = Field(
        default=None,
        ge=0,
    )

    salary_per_day: Decimal | None = Field(
        default=None,
        ge=0,
    )

    amount: Decimal | None = Field(
        default=None,
        ge=0,
    )