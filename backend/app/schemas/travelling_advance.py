from datetime import date
from decimal import Decimal
from pydantic import BaseModel


class TravellingAdvanceCreate(BaseModel):
    user_id: int
    employee_code: str | None = None
    designation: str | None = None
    department: str | None = None
    from_date: date | None = None
    to_date: date | None = None
    place_visited: str | None = None
    purpose_of_visit: str | None = None

    type_of_expense: str | None = None
    expense_amount: Decimal | None = None

    additional_expense_type: str | None = None
    additional_expense_amount: Decimal | None = None

    other_expense_type: str | None = None
    other_expense_amount: Decimal | None = None

    total_advance: Decimal | None = None


class TravellingAdvanceUpdate(BaseModel):
    user_id: int
    employee_code: str | None = None
    designation: str | None = None
    department: str | None = None
    from_date: date | None = None
    to_date: date | None = None
    place_visited: str | None = None
    purpose_of_visit: str | None = None
    type_of_expense: str | None = None
    expense_amount: Decimal | None = None
    additional_expense_type: str | None = None
    additional_expense_amount: Decimal | None = None
    other_expense_type: str | None = None
    other_expense_amount: Decimal | None = None
    total_advance: Decimal | None = None