from datetime import date
from decimal import Decimal
from pydantic import BaseModel, Field


class TravellingAdvanceBudgetCreate(BaseModel):
    type: str
    amount: Decimal = Field(default=Decimal("0"), ge=0)


class TravellingAdvanceCreate(BaseModel):
    employee_code: str = Field(min_length=1, max_length=50)
    designation: str | None = None
    department: str | None = None

    from_date: date | None = None
    to_date: date | None = None

    place_visited: str | None = None
    purpose_of_visit: str | None = None

    type_of_expense: str | None = None
    expense_amount: Decimal = Field(default=Decimal("0"), ge=0)

    additional_expense_type: str | None = None
    additional_expense_amount: Decimal = Field(default=Decimal("0"), ge=0)

    other_expense_type: str | None = None
    other_expense_amount: Decimal = Field(default=Decimal("0"), ge=0)

    total_advance: Decimal | None = None
    total_advance_words: str | None = None

    budget_items: list[TravellingAdvanceBudgetCreate] = Field(
        default_factory=list
    )


class TravellingAdvanceUpdate(BaseModel):
    employee_code: str | None = None
    designation: str | None = None
    department: str | None = None

    from_date: date | None = None
    to_date: date | None = None

    place_visited: str | None = None
    purpose_of_visit: str | None = None

    type_of_expense: str | None = None
    expense_amount: Decimal | None = Field(default=None, ge=0)

    additional_expense_type: str | None = None
    additional_expense_amount: Decimal | None = Field(default=None, ge=0)

    other_expense_type: str | None = None
    other_expense_amount: Decimal | None = Field(default=None, ge=0)

    total_advance: Decimal | None = None
    total_advance_words: str | None = None

    budget_items: list[TravellingAdvanceBudgetCreate] | None = None